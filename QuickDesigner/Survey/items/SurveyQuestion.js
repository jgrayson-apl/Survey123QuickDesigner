/**
 *
 * SurveyQuestion
 *  - Survey123 Question
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
  "dojo/store/Observable",
  "dojo/store/Memory"
], function (declare, lang, array, topic, SurveyItem, Observable, Memory) {

  // CLASS //
  var SurveyQuestion = declare([SurveyItem], {

    // CLASS NAME //
    declaredClass: "SurveyQuestion",

    /**
     *
     */
    type: "Question",

    /**
     *
     */
    questionType: "string",

    /**
     *
     */
    hint: "",

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
     *
     */
    constraintType: "=",

    /**
     *
     */
    constraint: "=0",

    /**
     *
     */
    constraintMsg: "",

    /**
     *
     */
    required: false,

    /**
     *
     */
    appearance: "default",

    /**
     *
     */
    choices: null,

    /**
     *
     */
    choicesHasOther: false,

    /**
     * ...add multiple languages to a form
     * - use label::language1
     *
     * array of objects   ( ...or... ???? )
     *  {
     *    language:"English",
     *    label:"some label",
     *    hint:"some hint"
     *  }
     */
    languages: [],

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
    _questionTypeSetter: function (value) {
      if(this.questionType !== value) {
        this.questionType = value;

        // APPEARANCE //
        this.set("appearance", "default");

        // CHOICES //
        switch (this.questionType) {
          case "select":
          case "select1":
            this.set("choices", new Observable(new Memory({
              idProperty: "value",
              data: []
            })));
            break;

          default:
            this.set("choices", null);
        }
        // CHOICES HAS OTHER //
        this.set("choicesHasOther", false);

        // CHOICES CHANGED //
        this.emit("question-type-change", this);
      }
    },

    _choicesHasOtherSetter: function (value) {
      this.choicesHasOther = value;
      this.emit("question-choices-change", this);
    },

    addChoice: function (choice) {
      if(this.choices) {
        this.choices.add(choice);
        this.emit("question-choices-change", this);
      }
    },

    updateChoice: function (choice) {
      if(this.choices) {
        this.choices.put(choice);
        this.emit("question-choices-change", this);
      }
    },

    removeChoice: function (choice) {
      if(this.choices) {
        this.choices.remove(choice.value);
        this.emit("question-choices-change", this);
      }
    },

    getChoiceName: function (base) {
      if(this.choices) {
        var newName = base;
        var count = 0;
        do {
          newName = lang.replace("{0} {1}", [base, ++count]);
        } while (this.choices.get(this._clean(newName)));
        return newName;
      } else {
        return "NO CHOICES !!!!";
      }
    },

    getRelevantQuestions: function () {
      return this.parent.getRelevantQuestions(this);
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

      array.forEach(SurveyQuestion.ATTRIBUTES, lang.hitch(this, function (attName) {
        asJson[attName] = this[attName];
      }));
      array.forEach(SurveyQuestion.OPTIONS, lang.hitch(this, function (attName) {
        asJson[attName] = this[attName];
      }));

      asJson["choices"] = this.choices ? lang.clone(this.choices.data) : null;

      return asJson;
    }

  });

  /**
   * CLONE QUESTION
   *
   * @param otherQuestion
   */
  SurveyQuestion.clone = function (otherQuestion) {

    var clonedQuestion = new SurveyQuestion({
      parent: otherQuestion.parent
    });

    array.forEach(SurveyQuestion.ATTRIBUTES, lang.hitch(this, function (attName) {
      clonedQuestion.set(attName, otherQuestion.get(attName))
    }));
    array.forEach(SurveyQuestion.OPTIONS, lang.hitch(this, function (attName) {
      clonedQuestion.set(attName, otherQuestion.get(attName))
    }));

    if(otherQuestion.choices) {
      clonedQuestion.set("choices", new Memory({
        idProperty: "value",
        data: lang.clone(otherQuestion.choices.data)
      }));
    }

    return clonedQuestion;
  };

  /**
   * ATTRIBUTES
   *
   * @type {string[]}
   */
  SurveyQuestion.ATTRIBUTES = ["questionType", "hint"];


  /**
   * OPTIONS
   *
   * @type {string[]}
   */
  SurveyQuestion.OPTIONS = ["relevant", "relevantValue", "relevantQuestion", "constraintType", "constraint", "constraintMsg", "required", "appearance", "choicesHasOther"];


  /**
   *
   * @type {string[]}
   */
  SurveyQuestion.MAYHAVE_CHOICES = ["select", "select1"];

  /**
   *
   * @type {string[]}
   */
  SurveyQuestion.MAYHAVE_CONSTRAINT = ["int", "decimal"];

  /**
   *
   * @type {string[]}
   */
  SurveyQuestion.MAYHAVE_APPEARANCE = ["select", "select1", "geopoint"];

  /**
   *
   * @type {{id: string, name: string}[]}
   */
  SurveyQuestion.APPEARANCE = [
    {id: "default", name: "Default"},
    {id: "full", name: "Full"},
    {id: "compact", name: "Compact"},
    {id: "minimal", name: "Minimal"}
  ];

  /**
   *
   * @type {string[]}
   */
  SurveyQuestion.RELEVANT_TYPES = [
    "int",
    "decimal",
    "select",
    "select1"
  ];

  /**
   * QUESTION TYPES
   *
   * @type {*[]}
   */
  SurveyQuestion.QUESTION_TYPES = [
    {id: "int", name: "Integer", title: "Integer (i.e., whole number) input"},
    {id: "decimal", name: "Decimal", title: "Decimal input"},
    {id: "string", name: "Text", title: "Free text response"},
    {id: "note", name: "Note", title: "Display a note on the screen, takes no input"},
    {id: "geopoint", name: "GeoPoint", title: "Collect a single GPS coordinates"},
    {id: "date", name: "Date", title: "Date input"},
    /*{id: "time", name: "Time", title: "Time input"},*/
    /*{id: "dateTime", name: "Date & Time", title: "Accepts a date and a time input"},*/
    {id: "image", name: "Image", title: "Take a picture"},
    /*{id: "audio", name: "Audio", title: "Record a sound"},*/
    /*{id: "video", name: "Video", title: "Record a video"},*/
    {id: "select1", name: "Select One", title: "Multiple choice question; only one answer can be selected"},
    {id: "select", name: "Select Multiple", title: "Multiple choice question; multiple answers can be selected"}
  ];

  // VERSION //
  SurveyQuestion.version = "0.0.1";

  // RETURN CLASS //
  return SurveyQuestion;
});
  

