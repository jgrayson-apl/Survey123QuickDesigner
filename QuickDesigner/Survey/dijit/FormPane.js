/**
 *
 * FormPane
 *  - FormPane dijit
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
  "dojo/query",
  "dojo/window",
  "dijit/registry",
  "dojo/dom",
  "dojo/dom-class",
  "../items/SurveyForm",
  "../items/SurveyGroup",
  "./GroupPane",
  "put-selector/put",
  "dijit/InlineEditBox",
  "dijit/form/ComboButton",
  "dijit/DropDownMenu",
  "dijit/MenuItem",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/CheckBox",
  "dijit/_WidgetBase",
  "dijit/_Container",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./template/FormPane.html",
  "xstyle!./css/FormPane.css"
], function (declare, Evented, lang, query, win, registry, dom, domClass,
             SurveyForm, SurveyGroup, GroupPane, put,
             InlineEditBox, ComboButton, DropDownMenu, MenuItem,
             BorderContainer, ContentPane, Button, Select, TextBox, CheckBox,
             _WidgetBase, _Container, _TemplatedMixin, _WidgetsInTemplateMixin, dijitTemplate) {

  var FormPane = declare([_WidgetBase, _Container, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    declaredClass: "FormPane",
    baseClass: "formPane",
    templateString: dijitTemplate,

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

      this.surveyForm.pane = this;

      this.nameInput.set("value", this.surveyForm.name);
      this.titleInput.set("value", this.surveyForm.title);
      this.nameRead.innerHTML = lang.replace("{name}: ", this.surveyForm);

      this.newGroup(null, true);
    },

    focus: function () {
      this.nameInput.edit();
    },

    /**
     *
     * @param value
     * @private
     */
    _nameChange: function (value) {
      this.surveyForm.set("name", value);
      this.nameRead.innerHTML = lang.replace("{name}: ", this.surveyForm);
    },

    /**
     *
     * @param value
     * @private
     */
    _titleChange: function (value) {
      this.surveyForm.set("title", value);
      this.surveyForm.update();
    },

    /**
     *
     * @private
     */
    _newGroup: function () {
      this.newGroup();
    },

    /**
     *
     * @private
     */
    _newRepeat: function () {
      this.newRepeat();
    },

    /**
     *
     * @param label
     */
    newGroup: function (label) {
      var newGroup = this.surveyForm.newGroup(label);
      this._newGroupPane(newGroup);
    },

    /**
     *
     * @param group
     */
    addGroup: function (group) {
      this.surveyForm.addGroup(group);
      this._newGroupPane(group);
    },

    /**
     *
     * @param label
     */
    newRepeat: function (label) {
      var newGroup = this.surveyForm.newRepeat(label);
      this._newGroupPane(newGroup);
    },

    /**
     *
     * @param group
     */
    addRepeat: function (group) {
      this.surveyForm.addRepeat(group);
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
    },

    /**
     *
     */
    collapse: function () {
      query(".questionPane", this.containerNode).forEach(lang.hitch(this, function (node) {
        var questionPane = registry.getEnclosingWidget(node);
        questionPane.set("editing", false);
      }));
    },

    /**
     *
     */
    destroy: function () {
      this.surveyForm.remove();
      this.inherited(arguments);
    }

  });

  FormPane.version = "0.0.1";

  return FormPane;
});