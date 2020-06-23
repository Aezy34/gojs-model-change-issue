import {
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit,
  OnInit,
  OnDestroy,
} from "@angular/core";
import * as go from "gojs";
import {
  DataSyncService,
  DiagramComponent,
  PaletteComponent,
} from "gojs-angular";
import {
  ChatEntityMessage,
  ChatGraphMessage,
} from "./shared/model/graph.model";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild("graphComponent", { static: true })
  graphComponent: DiagramComponent;

  graphNodeData: Array<any> = [];
  graphLinkData: Array<go.ObjectData> = [];

  // CSS classes
  diagramDivClassName = "myDiagramDiv";

  observedDiagram = null;
  skipsDiagramUpdate = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {}

  ngOnDestroy() {}
  // initialize diagram / templates
  initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      layout: $(go.TreeLayout, {
        isInitial: true,
        isOngoing: true,
        treeStyle: go.TreeLayout.StyleLastParents,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        // properties for most of the tree:
        angle: 90,
        layerSpacing: 35,
        // properties for the "last parents":
        alternateAngle: 90,
        alternateLayerSpacing: 35,
        alternateAlignment: go.TreeLayout.AlignmentBus,
        alternateNodeSpacing: 20,
      }),
      "undoManager.isEnabled": true,
      "linkingTool.isEnabled": false,
      "linkingTool.direction": go.LinkingTool.ForwardsOnly,
      model: $(go.GraphLinksModel, {
        linkToPortIdProperty: "toPort",
        linkFromPortIdProperty: "fromPort",
        linkKeyProperty: "key", // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        nodeKeyProperty: "key",
        nodeCategoryProperty: "category",
      }),
    });

    // Function to bind property of a property (ChatGraphMessage.message.text)
    const makeTwoWaySubBinding = (
      targetname,
      sourcename,
      conversion?,
      backconversion?
    ) => {
      const bind = new go.Binding(targetname, "message");
      bind.mode = go.Binding.TwoWay;
      bind.converter = (message, target) => {
        const value = message[sourcename];
        if (value === undefined) return target[targetname];
        return typeof conversion === "function"
          ? conversion(value, target)
          : value;
      };
      bind.backConverter = (value, data, model) => {
        const message = data.message;
        if (model)
          model.setDataProperty(
            message,
            sourcename,
            typeof backconversion === "function"
              ? backconversion(value, message, model)
              : value
          );
        else
          message[sourcename] =
            typeof backconversion === "function"
              ? backconversion(value, message, model)
              : value;
        return message;
      };
      return bind;
    };

    const createBasicGraphNodeTemplate = (color) => {
      const node = $(
        go.Node,
        "Spot",
        $(
          go.Panel,
          "Auto",
          $(go.Shape, "RoundedRectangle", {
            stroke: color,
            fill: color,
            strokeWidth: 3.5,
            minSize: new go.Size(100, NaN),
            portId: "",
            fromSpot: go.Spot.AllSides,
            fromLinkable: true,
            toSpot: go.Spot.AllSides,
            toLinkable: true,
          }),
          $(
            go.TextBlock,
            {
              margin: 8,
              maxSize: new go.Size(160, NaN),
              font: "bold 11pt Lato, Helvetica, Arial, sans-serif",
              stroke: "#F8F8F8",
              wrap: go.TextBlock.WrapFit,
              editable: true,
            },
            makeTwoWaySubBinding("text", "text")
          )
        )
      );
      return node;
    };

    dia.nodeTemplateMap.add("", createBasicGraphNodeTemplate("#FF9CDB"));
    dia.nodeTemplateMap.add("BOT", createBasicGraphNodeTemplate("#2DDB9C"));
    dia.nodeTemplateMap.add("CLIENT", createBasicGraphNodeTemplate("#8292B0"));
    dia.nodeTemplateMap.add("AGENT", createBasicGraphNodeTemplate("#2D9CDB"));

    return dia;
  }

  // When the diagram model changes, update app data to reflect those changes
  diagramModelChange = function (changes: go.IncrementalData) {
    this.skipsDiagramUpdate = true;
    this.graphNodeData = DataSyncService.syncNodeData(
      changes,
      this.graphNodeData
    );
    this.graphLinkData = DataSyncService.syncLinkData(
      changes,
      this.graphLinkData
    );
    this.diagramModelData = DataSyncService.syncModelData(
      changes,
      this.diagramModelData
    );
  };

  exampleMessagesArray = [
    new ChatGraphMessage("1", new ChatEntityMessage("First message", "AGENT")),
    new ChatGraphMessage("2", new ChatEntityMessage("Second message", "BOT")),
    new ChatGraphMessage("3", new ChatEntityMessage("Third message", "CLIENT")),
    new ChatGraphMessage("4", new ChatEntityMessage("Fourth message", "AGENT")),
  ];

  changeModel() {
    this.graphNodeData = [];
    this.graphLinkData = [];
    const model = new go.GraphLinksModel(
      this.graphNodeData,
      this.graphLinkData
    );
    model.linkToPortIdProperty = "toPort";
    model.linkFromPortIdProperty = "fromPort";
    model.linkKeyProperty = "key";
    model.nodeKeyProperty = "key";
    model.nodeCategoryProperty = "category";
    this.graphComponent.diagram.model = model;

    this.exampleMessagesArray.forEach((message) => {
      this.graphNodeData.push(message);
    });
  }

  ngAfterViewInit() {
    if (this.observedDiagram) return;
    this.observedDiagram = this.graphComponent.diagram;

    this.changeModel();

    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)
  } // end ngAfterViewInit

  // Print this.graphNodeData and model.nodeDataArray
  clickLogNodes() {
    console.clear();
    console.log("%c this.graphNodeData", "background: #222; color: #bada55");
    console.table(this.graphNodeData);
    console.log(
      "%c diagram.model.nodeDataArray",
      "background: #222; color: #bada55"
    );
    console.table(this.graphComponent.diagram.model.nodeDataArray);
  }
}
