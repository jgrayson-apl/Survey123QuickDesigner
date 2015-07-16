/**
 *
 * DesignerPane
 *  - DesignerPane dijit
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  4/14/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/Evented",
  "dojo/Deferred",
  "dojo/aspect",
  "dojo/topic",
  "dojo/window",
  "dojo/json",
  "dijit/registry",
  "../export/SurveyExporter",
  "../items/SurveyForm",
  "./FormPane",
  "put-selector/put",
  "dojo/store/Observable",
  "dojo/store/Memory",
  "dijit/tree/ObjectStoreModel",
  "dijit/Tree",
  "dijit/tree/dndSource",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "dijit/ConfirmDialog",
  "dijit/_WidgetBase",
  "dijit/_Container",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./template/DesignerPane.html",
  "xstyle!./css/DesignerPane.css"
], function (declare, lang, array, Evented, Deferred, aspect, topic, win, json, registry,
             SurveyExporter, SurveyForm, FormPane, put,
             Observable, Memory, ObjectStoreModel, Tree, dndSource,
             BorderContainer, ContentPane, Button, ConfirmDialog,
             _WidgetBase, _Container, _TemplatedMixin, _WidgetsInTemplateMixin, dijitTemplate) {

  var DesignerPane = declare([_WidgetBase, _Container, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    declaredClass: "DesignerPane",
    baseClass: "designerPane",
    templateString: dijitTemplate,

    /**
     *
     */
    surveyExporter: null,

    /**
     *
     */
    formItemStore: null,

    /**
     *
     */
    surveyForm: null,

    /**
     *
     */
    formPane: null,

    /**
     *
     * @param config
     * @param srcNodeRef
     */
    constructor: function (config, srcNodeRef) {
      declare.safeMixin(this, config);
      this.domNode = srcNodeRef;
    },

    /**
     *
     */
    postCreate: function () {
      this.inherited(arguments);
      //this.own();
    },

    /**
     *
     */
    startup: function () {
      this.inherited(arguments);

      //
      // EXPORT SURVEY //
      //
      this.surveyExporter = new SurveyExporter({});
      topic.subscribe("survey/change", lang.hitch(this, function () {
        this.previewLinkNode.innerHTML = "";
        this.downloadButton.set("disabled", false);
      }));


      //
      // ITEM STORE  //
      //
      this.formItemStore = new Observable(new Memory({
        data: [],
        idProperty: "name",
        _getUniqueId: function (base) {
          var newName = base;
          var count = 0;
          do {
            newName = lang.replace("{0} {1}", [base, ++count]);
          } while (this.get(this._clean(newName)));
          return newName;
        },
        _clean: function (label) {
          return label.replace(/[\-,\(\)?~!@#$%&*+\-\'=\"]/g, "").replace(/ /g, "_");
        },
        getChildren: function (parent) {
          return this.query(lang.hitch(this, function (item) {
            return (item.parent && parent && (item.parent.name === parent.name));
          }));
        }
      }));

      // TRYING TO ADD SUPPORT FOR DND SO WE CAN 'MOVE' ITEMS AROUND... //
      /*
       aspect.around(this.formItemStore, "put", lang.hitch(this, function (originalPut) {
       // To support DnD, the store must support put(child, {parent: parent}).
       // Since memory store doesn't, we hack it.
       // Since our store is relational, that just amounts to setting child.parent
       // to the parent's id.
       return lang.hitch(this, function (obj, options) {
       if(options && options.parent) {
       obj.parent = options.parent;
       }
       return originalPut.call(this.formItemStore, obj, options);
       })
       }));
       */

      // ADD //
      topic.subscribe("survey/items/add", lang.hitch(this, function (item) {
        item.label = this.formItemStore._getUniqueId(item.type);
        item.name = this.formItemStore._clean(item.label);
        this.formItemStore.add(item);
      }));
      // UPDATE //
      topic.subscribe("survey/items/update", lang.hitch(this, function (item) {
        this.formItemStore.put(item);
      }));
      // REMOVE //
      topic.subscribe("survey/items/remove", lang.hitch(this, function (item) {
        this.formItemStore.remove(item.name);
        array.forEach(this.formItemStore.getChildren(item), lang.hitch(this, function (childItem) {
          this.formItemStore.remove(childItem.name);
        }));
      }));

      //
      // SURVEY FORM //
      //
      this.surveyForm = new SurveyForm({
        id: "myform",
        title: "My first survey",
        itemStore: this.formItemStore
      });

      // INITIALIZE TREE OVERVIEW //
      this.initializeOverview(this.formItemStore).then(lang.hitch(this, function () {

        //
        // FORM PANE //
        //
        this.formPane = new FormPane({
          surveyForm: this.surveyForm
        }, this.formNode);
        this.formPane.startup();

      }), lang.hitch(this, function (error) {
        console.warn(error);
      }));

    },

    /**
     *
     * @param itemStore
     * @returns {*}
     */
    initializeOverview: function (itemStore) {
      var deferred = new Deferred();

      // OVERVIEW TREE MODEL //
      this.treeModel = new ObjectStoreModel({
        store: itemStore,
        query: {type: "Form"}//,
        /*
         mayHaveChildren: function (item) {
         item.mayHaveChildren;
         }
         */
      });

      // OVERVIEW TREE //
      this.overviewTree = new Tree({
        model: this.treeModel,
        autoExpand: true,
        // TREE NODE CLICK //
        onClick: lang.hitch(this, this.onTreeNodeClick),
        /*
         dndController: dndSource,
         betweenThreshold: 5,
         checkItemAcceptance: function (node, source, position) {
         var item = registry.getEnclosingWidget(node).item;
         return item.mayHaveChildren || (position != "over");
         },
         */
        getIconClass: function (item) {
          return lang.replace("iconFormItem icon{type}", item);
        },
        getLabelClass: function (item) {
          var labelClasses = ["labelFormItem"];
          labelClasses.push(lang.replace("label{type}", item));
          if(item.relevant) {
            labelClasses.push("relevant");
          }
          return labelClasses.join(" ");
        },
        getLabel: function (item) {
          return (item.type === "Form") ? item.name : item.label;
        }
      }, put(this.treeNode, "div"));
      // TREE LOADED //
      this.overviewTree.onLoadDeferred.then(lang.hitch(this, function () {
        // TREE NODE CLICK //
        //aspect.after(overviewTree, "onClick", lang.hitch(this, this.onTreeNodeClick), true);

        // QUESTION EDITING CHANGE //
        topic.subscribe("survey/editing/change", lang.hitch(this, this.onItemEditingChange));

        // QUESTIONS AND GROUP RELEVANT //
        topic.subscribe("survey/relevant/set", lang.hitch(this, this.onItemRelevantSet));
        topic.subscribe("survey/relevant/clear", lang.hitch(this, this.onItemRelevantClear));

        deferred.resolve();
      }));
      this.overviewTree.startup();

      return deferred.promise;
    },

    /**
     *
     * @param surveyItem
     */
    onTreeNodeClick: function (surveyItem) {

      if(surveyItem.type === "Question") {
        surveyItem.parent.pane.collapse();
        surveyItem.pane.set("editing", true);
      } else {
        surveyItem.pane.collapse();
        surveyItem.pane.focus();
      }

      win.scrollIntoView(surveyItem.pane.domNode);
    },

    /**
     *
     * @param item
     * @param editing
     */
    onItemEditingChange: function (item, editing) {
      var selectedQuestions = array.filter(this.overviewTree.get("selectedItems"), function (selectedItem) {
        return (selectedItem.type === "Question");
      });
      var questionIndex = array.indexOf(selectedQuestions, item);
      if((questionIndex > -1) && (!editing)) {
        selectedQuestions.splice(questionIndex, 1);
      } else {
        if(editing) {
          selectedQuestions.push(item);
        }
      }
      this.overviewTree.set("selectedItems", selectedQuestions);
    },

    /**
     *
     * @param source
     * @param relevantQuestion
     */
    onItemRelevantSet: function (source, relevantQuestion) {
      console.log(lang.replace("{0} is now relevant to {1}", [source.name, relevantQuestion.name]));
    },

    /**
     *
     * @param source
     * @param relevantQuestion
     */
    onItemRelevantClear: function (source, relevantQuestion) {
      console.log(lang.replace("{0} is NO longer relevant to {1}", [source.name, relevantQuestion.name]));
    },

    /**
     *
     */
    _displayXMLPreview: function () {
      if(this.surveyForm) {
        // SURVEY AS XFORM XML TEXT //
        var surveyAsXMLText = this.surveyExporter.toXMLText(this.surveyForm, true);
        // DISPLAY PREVIEW //
        this._displayPreview(surveyAsXMLText);
      }
    },

    /**
     *
     * @private
     */
    _displayXMLJSONPreview: function () {
      if(this.surveyForm) {
        // SURVEY AS XFORM XML JSON TEXT //
        var surveyAsXmlJsonText = this.surveyExporter.toXmlJsonText(this.surveyForm, true);
        // DISPLAY PREVIEW //
        this._displayPreview(surveyAsXmlJsonText);
      }
    },

    /**
     *
     * @private
     */
    _displayJsonPreview: function () {
      if(this.surveyForm) {
        // SURVEY AS XFORM JSON TEXT //
        var surveyAsJsonText = this.surveyExporter.toJsonText(this.surveyForm, true);
        // DISPLAY PREVIEW //
        this._displayPreview(surveyAsJsonText);
      }
    },

    /**
     *
     * @param surveyAsText
     * @private
     */
    _displayPreview: function (surveyAsText) {

      // TEXT AREA //
      var textArea = put("textarea", {cols: 80, rows: 40, innerHTML: surveyAsText});

      // PREVIEW DIALOG //
      var previewDlg = new ConfirmDialog({
        title: "Quick Designer",
        content: textArea
      });
      previewDlg.show();
      textArea.select();

    },

    /**
     *
     *  ALTERNATIVE: https://enketo.org/webform/preview?form=http://maps.esri.com/AGSJS_Demos/Survey123/QuickDesigner/debug/DEBUG.XML
     */
    _displayDownloadLink: function () {
      this.previewLinkNode.innerHTML = "...";
      if(this.surveyForm) {
        var downloadInfo = this.surveyExporter.toDownloadInfo(this.surveyForm);
        this.previewLinkNode.innerHTML = downloadInfo.filename;
        this.previewLinkNode.download = downloadInfo.filename;
        this.previewLinkNode.href = downloadInfo.href;
        this.downloadButton.set("disabled", true);
      }
    },

    /**
     *
     * @private
     */
    _publishSurvey: function () {
      this.surveyExporter.publishAsService(this.surveyForm);
    },

    _previewSurvey: function () {
      this.surveyExporter.publishAsService(this.surveyForm);
    },

    /**
     *
     */
    destroy: function () {
      this.inherited(arguments);
    }

  });

  DesignerPane.version = "0.0.1";

  return DesignerPane;
});