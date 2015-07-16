/**
 *
 * SurveyForm
 *  - Survey Form
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  3/16/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "./SurveyGroup",
  "./SurveyQuestion"
], function (declare, lang, array, SurveyGroup, SurveyQuestion) {

  // CLASS //
  var SurveyForm = declare([SurveyGroup], {

    // CLASS NAME //
    declaredClass: "SurveyForm",

    /**
     *
     */
    type: "Form",

    /**
     * NAME
     */
    name: "",

    /**
     * TITLE
     */
    title: "",

    /**
     * FORM ID - NO UI TO CHANGE THIS VALUE...
     */
    id: "",

    /**
     *
     */
    itemStore: null,

    /**
     *
     */
    relevant: false,


    /**
     * CONSTRUCTOR
     */
    constructor: function (options) {
      /**/
    },

    /**
     *
     * @param value
     * @private
     */
    _nameSetter: function (value) {
      this.name = this._clean(value);
      this.update();
    },

    /**
     *
     * @param searchItem
     * @returns {*}
     */
    getChildren: function (searchItem) {
      return this.itemStore.getChildren(searchItem);
    },

    /**
     *
     * @param source
     * @param parent
     * @param searchResults
     * @returns {*}
     */
    getRelevantQuestions: function (source, parent, searchResults) {

      if(!searchResults) { searchResults = []; }

      this.getChildren(parent || this).some(lang.hitch(this, function (child) {
        if(child.declaredClass === "SurveyGroup") {
          return this.getRelevantQuestions(source, child, searchResults);
        } else {
          var found = (child.name === source.name);
          if(!found) {
            if(array.indexOf(SurveyQuestion.RELEVANT_TYPES, child.questionType) > -1) {
              searchResults.push(child);
            }
          }
          return found;
        }
      }));

      return searchResults;
    },

    /**
     *
     * @returns {{name: string, label: string, hint: string}}
     */
    toJson: function () {

      var asJson = {
        id: this.get("nodeset"),
        type: this.type,
        name: this.name,
        title: this.title,
        formId: this.id
      };

      asJson.children = this.getChildren(this).map(lang.hitch(this, function (child) {
        return child.toJson();
      }));

      return asJson;
    }

  });

  // VERSION //
  SurveyForm.version = "0.0.1";

  // RETURN CLASS //
  return SurveyForm;
});
  

