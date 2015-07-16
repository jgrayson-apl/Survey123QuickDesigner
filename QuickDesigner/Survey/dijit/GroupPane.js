/**
 *
 * GroupPane
 *  - GroupPane dijit
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  3/17/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/Evented",
  "dojo/_base/lang",
  "dojo/dom-class",
  "dojo/window",
  "dojo/number",
  "dojo/query",
  "dijit/registry",
  "put-selector/put",
  "dojo/store/Memory",
  "../items/SurveyQuestion",
  "./QuestionPane",
  "./RelevantPane",
  "dijit/Fieldset",
  "dijit/InlineEditBox",
  "dijit/form/ComboButton",
  "dijit/DropDownMenu",
  "dijit/MenuItem",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/CheckBox",
  "dijit/_WidgetBase",
  "dijit/_Container",
  "dijit/_Contained",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./template/GroupPane.html",
  "xstyle!./css/GroupPane.css"
], function (declare, Evented, lang, domClass, win, number, query, registry, put, Memory, SurveyQuestion, QuestionPane, RelevantPane,
             Fieldset, InlineEditBox, ComboButton, DropDownMenu, MenuItem,
             ContentPane, Button, Select, TextBox, CheckBox,
             _WidgetBase, _Container, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, dijitTemplate) {

  var GroupPane = declare([_WidgetBase, _Container, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    declaredClass: "GroupPane",
    baseClass: "groupPane",
    templateString: dijitTemplate,

    group: null,

    /**
     *
     * @param config
     * @param srcNodeRef
     */
    constructor: function (config, srcNodeRef) {
      declare.safeMixin(this, config);
      this.domNode = srcNodeRef;
    },

    postCreate: function () {
      this.inherited(arguments);
      //this.own();
    },

    buildRendering: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);

      this.group.pane = this;

      domClass.toggle(this.isRepeatNode, "dijitHidden", !this.group.isRepeat);

      this.labelRead.innerHTML = lang.replace("{label}: ", this.group);
      this.labelPath.innerHTML = this.group.get("nodeset");


      // RELEVANT //
      this.relevantPane = new RelevantPane({source: this.group}, put(this.relevantPane.containerNode, "div"));
      this.relevantPane.startup();

      this.newQuestion(null);
    },

    focus: function () {
      this.titleBox.edit();
    },

    _titleChange: function (value) {
      this.group.set("label", value);
      this.group.update();
      this.labelRead.innerHTML = lang.replace("{label}: ", this.group);
      this.labelPath.innerHTML = this.group.get("nodeset");
    },
    _getTitleAttr: function () {
      this.titleBox.get("value");
    },
    _setTitleAttr: function (value) {
      this.titleBox.set("value", value);
    },
    _newQuestion: function () {
      this.newQuestion();
    },
    _newRepeat: function () {
      this.newRepeat();
    },
    _newGroup: function () {
      this.newGroup();
    },

    _remove: function () {
      var confirmMessage = lang.replace("Are you sure you want to remove the group called '{label}'?", this.group);
      if(confirm(confirmMessage)) {
        this.destroy();
      }
    },

    /**
     *
     * @param label
     */
    newGroup: function (label) {
      var newGroup = this.group.newGroup(label);
      this._newGroupPane(newGroup);
    },

    /**
     *
     * @param group
     */
    addGroup: function (group) {
      this.group.addGroup(group);
      this._newGroupPane(group);
    },

    /**
     *
     * @param label
     */
    newRepeat: function (label) {
      var newGroup = this.group.newRepeat(label);
      this._newGroupPane(newGroup);
    },

    /**
     *
     * @param group
     */
    addRepeat: function (group) {
      this.group.addRepeat(group);
      this._newGroupPane(group);
    },

    /**
     *
     * @param group
     * @private
     */
    _newGroupPane: function (group) {
      this.collapse();

      var groupPane = new GroupPane({
        title: group.label,
        group: group
      }, put(this.containerNode, "div"));
      groupPane.startup();
      win.scrollIntoView(groupPane.domNode);

      this.group.update();
    },

    /**
     *
     * @param label
     */
    newQuestion: function (label) {
      var newQuestion = this.group.newQuestion(label);
      this._addQuestionPane(newQuestion);
    },

    /**
     *
     * @param question
     */
    addQuestion: function (question) {
      this.group.addQuestion(question);
      this._addQuestionPane(question);
    },

    /**
     *
     * @param question
     * @private
     */
    _addQuestionPane: function (question) {
      this.collapse();

      var questionPane = new QuestionPane({
        question: question
      }, put(this.containerNode, "div"));
      questionPane.startup();
      win.scrollIntoView(questionPane.domNode);

      // COPY //
      questionPane.on("copy", lang.hitch(this, function (question) {
        var copyQuestion = SurveyQuestion.clone(question);
        this.addQuestion(copyQuestion);
      }));
      // DELETE //
      questionPane.on("delete", lang.hitch(this, function (question) {
        questionPane.destroy();
      }));
      this.group.update();
    },

    /**
     *
     */
    collapse: function () {
      query(".questionPane", this.containerNode).forEach(lang.hitch(this, function (node) {
        var questionPane = registry.getEnclosingWidget(node);
        questionPane.set("editing", false);
      }));
      if(this.group.parent) {
        this.group.parent.pane.collapse();
      }
    },

    /**
     *
     */
    destroy: function () {
      this.group.remove();
      this.inherited(arguments);
    }

  });

  GroupPane.version = "0.0.1";

  return GroupPane;
});