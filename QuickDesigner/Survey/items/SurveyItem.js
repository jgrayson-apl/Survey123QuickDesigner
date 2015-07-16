/**
 *
 * SurveyItem
 *  - Survey 123 Item
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  3/16/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/Stateful",
  "dojo/Evented"
], function (declare, lang, topic, Stateful, Evented) {

  // CLASS //
  var SurveyItem = declare([Stateful, Evented], {

    // CLASS NAME //
    declaredClass: "SurveyItem",

    /**
     *
     */
    type: "Item",

    mayHaveChildren: false,

    /**
     *
     */
    name: "",

    /**
     *
     */
    label: "",

    /**
     *
     */
    hint: null,

    /**
     *
     */
    nodeset: "",

    /**
     *
     */
    path: "",

    /**
     *
     */
    parent: null,


    /**
     * CONSTRUCTOR
     */
    constructor: function (options) {
      /**/
    },

    /**
     *
     * @param args
     */
    postscript: function (args) {
      this.inherited(arguments);
      topic.publish("survey/items/add", this);
      topic.publish("survey/change");
    },

    /**
     *
     * @param label
     * @returns {string}
     * @private
     */
    _clean: function (label) {
      return label.replace(/[\-,\(\)?~!@#$%&*+\-\'=\"]/g, "").replace(/ /g, "_");
    },

    /**
     *
     * @returns {string}
     * @private
     */
    _nodesetGetter: function () {
      return (this.parent ? this.parent.get("nodeset") : "") + lang.replace("/{name}", this);
    },

    /**
     *
     * @returns {string}
     * @private
     */
    _pathGetter: function () {
      return (this.parent ? this.parent.get("path") : "") + " | " + this.label;
    },

    /**
     *
     */
    update: function () {
      topic.publish("survey/items/update", this);
      topic.publish("survey/change");
    },

    /**
     *
     */
    remove: function () {
      topic.publish("survey/items/remove", this);
      topic.publish("survey/change");
    }

  });

  // VERSION //
  SurveyItem.version = "0.0.1";

  // RETURN CLASS //
  return SurveyItem;
});
