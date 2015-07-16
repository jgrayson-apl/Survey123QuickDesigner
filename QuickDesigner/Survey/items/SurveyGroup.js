/**
 *
 * SurveyGroup
 *  - A group of SurveyQuestions
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  2/24/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "./SurveyItem",
  "./SurveyQuestion"
], function (declare, lang, array, topic, SurveyItem, SurveyQuestion) {

  // CLASS //
  var SurveyGroup = declare([SurveyItem], {

    // CLASS NAME //
    declaredClass: "SurveyGroup",

    /**
     *
     */
    type: "Group",

    mayHaveChildren: true,

    /**
     *
     *
     */
    relevant: false,

    /**
     *
     */
    relevantValue: "",

    /**
     * CONSTRUCTOR
     */
    constructor: function (options) {
      /**/
    },

    /**
     *
     * @param label
     * @returns {SurveyQuestion}
     */
    newQuestion: function (label) {
      return new SurveyQuestion({
        parent: this
      });
    },

    /**
     *
     * @param question
     * @returns {*}
     */
    addQuestion: function (question) {
      if(question) {
        question.set("parent", this);
        return question;
      } else {
        return this.newQuestion();
      }
    },

    /**
     *
     * @param label
     * @returns {SurveyGroup}
     */
    newGroup: function (label) {
      return new SurveyGroup({
        parent: this
      });
    },

    /**
     *
     * @param group
     * @returns {*}
     */
    addGroup: function (group) {
      if(group) {
        group.set("parent", this);
        return group;
      } else {
        return this.newGroup();
      }
    },

    /**
     *
     * @param label
     * @returns {SurveyGroup}
     */
    newRepeat: function (label) {
      return new SurveyGroup({
        parent: this,
        type: "Repeat"
      });
    },

    /**
     *
     * @param repeat
     * @returns {*}
     */
    addRepeat: function (repeat) {
      if(repeat) {
        repeat.set("parent", this);
        repeat.set("type", "Repeat");
        return repeat;
      } else {
        return this.newRepeat();
      }
    },

    /***
     *
     * @param searchItem
     * @returns {*}
     */
    getChildren: function (searchItem) {
      return this.parent.getChildren(searchItem);
    },

    /**
     *
     * @param source
     * @param parent
     * @param searchResults
     * @returns {*}
     */
    getRelevantQuestions: function (source, parent, searchResults) {
      return this.parent.getRelevantQuestions(source || this, parent, searchResults)
    },

    /**
     *
     * @returns {*}
     */
    toJson: function () {

      var asJson = {
        id: this.get("nodeset"),
        type: this.type,
        name: this.name,
        label: this.label,
        hint: this.hint
      };

      asJson.children = this.getChildren(this).map(lang.hitch(this, function (child) {
        return child.toJson();
      }));

      return asJson;
    }

  });

  // VERSION //
  SurveyGroup.version = "0.0.1";

  // RETURN CLASS //
  return SurveyGroup;
});
  

