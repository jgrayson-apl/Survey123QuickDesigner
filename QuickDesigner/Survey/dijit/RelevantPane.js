define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "dojo/dom",
  "dojo/dom-class",
  "put-selector/put",
  "dojo/Evented",
  "dojo/store/Observable",
  "dojo/store/Memory",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "dijit/ConfirmDialog",
  "dijit/form/Select",
  "dijit/form/NumberTextBox",
  "dijit/_WidgetBase",
  "dijit/_Contained",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./template/RelevantPane.html",
  "xstyle!./css/RelevantPane.css"
], function (declare, lang, array, topic, dom, domClass, put, Evented, Observable, Memory, ContentPane, Button, ConfirmDialog, Select, NumberTextBox,
             _WidgetBase, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, dijitTemplate) {

  var RelevantPane = declare([_WidgetBase, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    declaredClass: "RelevantPane",
    baseClass: "relevantPane",
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

    postCreate: function () {
      this.inherited(arguments);
      //this.own();
    },

    /**
     *
     * @private
     */
    _editRelevant: function () {

      // GET CURRENT POSSIBLE RELEVANT QUESTIONS //
      var relevantQuestions = this.source.getRelevantQuestions();
      if(relevantQuestions.length > 0) {

        var currentRelevantQuestionStore = new Observable(new Memory({
          idProperty: "name",
          data: relevantQuestions
        }));

        if(!this.relevantQuestionSelect.store) {
          this.relevantQuestionSelect.set("store", currentRelevantQuestionStore);
        }
        var previousRelevantQuestionsStore = this.relevantQuestionSelect.store;

        // IS THE SOURCE ALREADY RELEVANT //
        if(this.source.relevant) {

          array.forEach(previousRelevantQuestionsStore.query(), lang.hitch(this, function (relevantQuestion) {
            if(!currentRelevantQuestionStore.get(relevantQuestion.name)) {
              previousRelevantQuestionsStore.remove(relevantQuestion.name);
            }
          }));

          array.forEach(currentRelevantQuestionStore.query(), lang.hitch(this, function (relevantQuestion) {
            previousRelevantQuestionsStore.put(relevantQuestion);
          }));

        } else {
          this.relevantQuestionSelect.set("store", currentRelevantQuestionStore);
          this._relevantQuestionChange(relevantQuestions[0].name);
        }

        this.relevantDialog.show();

      } else {
        // NO POSSIBLE RELEVANT QUESTIONS //
        this._clearRelevant({errorMessage: "NO RELEVANT QUESTIONS CURRENTLY AVAILABLE"});
      }

    },

    /**
     *
     * @param value
     * @private
     */
    _relevantQuestionChange: function (value) {

      var relevantQuestion = this.relevantQuestionSelect.store.get(value);
      switch (relevantQuestion.questionType) {
        case "int":
        case "decimal":
          domClass.add(this.relevantValueAsList, "dijitHidden");
          domClass.remove(this.relevantValueAsNumber, "dijitHidden");
          break;

        case "select":
        case "select1":
          domClass.remove(this.relevantValueAsList, "dijitHidden");
          domClass.add(this.relevantValueAsNumber, "dijitHidden");

          var currentRelevantChoicesStore = new Observable(new Memory({
            idProperty: "value",
            data: lang.clone(relevantQuestion.choices.data)
          }));
          if(relevantQuestion.choicesHasOther) {
            currentRelevantChoicesStore.put({label: "Other", value: "other"});
          }
          this.relevantValueSelect.set("store", currentRelevantChoicesStore);
          break;
      }


      // TODO: SWITCH TO TOPICS INSTEAD OF EVENTED

      relevantQuestion.on("question-type-change", lang.hitch(this, function (evt) {
        this._clearRelevant({errorMessage: "THE TYPE FOR THE RELEVANT QUESTION HAS CHANGED"});
      }));

      relevantQuestion.on("question-choices-change", lang.hitch(this, function (evt) {
        this._clearRelevant({errorMessage: "THE CHOICES FOR THE RELEVANT QUESTION HAS CHANGED"});
      }));

      relevantQuestion.on("question-removed", lang.hitch(this, function (evt) {
        this._clearRelevant({errorMessage: "THE RELEVANT QUESTION HAS BEEN REMOVED"});
      }));

    },

    /**
     *
     * @private
     */
    _relevantEditEnd: function () {

      var relevantValue = "";
      var relevantLabel = "";
      var relevantQuestionValue = this.relevantQuestionSelect.get("value");
      var relevantQuestion = this.relevantQuestionSelect.store.get(relevantQuestionValue);
      switch (relevantQuestion.questionType) {
        case "int":
        case "decimal":
          relevantValue = relevantLabel = this.relevantValueInput.get("value");
          break;
        case "select":
        case "select1":
          relevantValue = lang.replace("'{0}'", [this.relevantValueSelect.get("value")]);
          relevantLabel = lang.replace("{0}", [this.relevantValueSelect.get("displayedValue")]);
          break;
      }

      var relevantCleanValue = lang.replace(" {0} = {1}", [relevantQuestion.get("nodeset"), relevantValue]);
      this.source.set("relevantValue", relevantCleanValue);
      this.source.set("relevant", true);
      this.source.update();

      topic.publish("survey/relevant/set", this.source, relevantQuestion);

      // RELEVANT LABEL //
      this.relevantLabel.innerHTML = lang.replace(" {0} is equal to {1}", [relevantQuestion.get("label"), relevantLabel]);
    },

    /**
     *
     * @param evt
     * @private
     */
    _clearRelevant: function (evt) {

      if(this.relevant) {
        var relevantQuestionValue = this.relevantQuestionSelect.get("value");
        var relevantQuestion = this.relevantQuestionSelect.store.get(relevantQuestionValue);
        topic.publish("survey/relevant/clear", this.source, relevantQuestion);
      }

      this.source.set("relevant", false);
      this.source.set("relevantValue", "");
      this.source.update();

      this.relevantLabel.innerHTML = "";
      if(evt.errorMessage) {
        put(this.relevantLabel, "div.relevant-error", evt.errorMessage);
      }
    },

    /**
     *
     */
    destroy: function () {
      this.inherited(arguments);
    }

  });

  return RelevantPane;
});