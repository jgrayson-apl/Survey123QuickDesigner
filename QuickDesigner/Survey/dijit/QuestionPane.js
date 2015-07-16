/**
 *
 * QuestionPane
 *  - QuestionPane dijit
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  3/11/2015 - 0.0.1 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/Evented",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom-class",
  "dojo/topic",
  "dojo/keys",
  "dojo/on",
  "dojo/query",
  "put-selector/put",
  "dojo/store/Observable",
  "dojo/store/Memory",
  "../items/SurveyQuestion",
  "./RelevantPane",
  "dijit/registry",
  "dijit/Fieldset",
  "dijit/layout/StackContainer",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/CheckBox",
  "dijit/form/NumberTextBox",
  "dijit/ConfirmDialog",
  "dijit/_WidgetBase",
  "dijit/_Contained",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./template/QuestionPane.html",
  "xstyle!./css/QuestionPane.css"
], function (declare, Evented, lang, array, domClass, topic, keys, on, query, put, Observable, Memory, SurveyQuestion, RelevantPane,
             registry, Fieldset, StackContainer, ContentPane, Button, Select, TextBox, CheckBox, NumberTextBox, ConfirmDialog,
             _WidgetBase, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, dijitTemplate) {

  var QuestionPane = declare([_WidgetBase, _Contained, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    declaredClass: "QuestionPane",
    baseClass: "questionPane",
    templateString: dijitTemplate,

    question: null,
    editing: true,
    items: null,

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

      this.question.pane = this;

      // REQUIRED //
      this.requiredChk.set("checked", this.question.required);

      // LABEL //
      this.labelInput.set("value", this.question.label);

      // HINT //
      this.hintInput.set("value", this.question.hint);

      // APPEARANCE //
      this.appearanceSelect.set("store", new Memory({
        data: SurveyQuestion.APPEARANCE
      }));
      this.appearanceSelect.set("value", this.question.appearance);

      // TYPE //
      this.typeSelect.set("store", new Memory({
        data: SurveyQuestion.QUESTION_TYPES
      }));
      this.typeSelect.set("value", this.question.questionType);


      // CONSTRAINT //
      var constraintValue = this.question.get("constraint");
      var constraintType = this.question.get("constraintType");
      switch (constraintType) {
        case "custom":
          this.constraintCustom.set("value", constraintValue);
          break;

        case "between":
        case "notbetween":
          var constraintBetweenParts = constraintValue.split(" and ");
          var firstBetweenValues = constraintBetweenParts[0].split(";");
          var secondBetweenValues = constraintBetweenParts[1].split(";");

          this.firstConstraintValue.set("value", firstBetweenValues[1]);
          this.secondConstraintValue.set("value", secondBetweenValues[1]);
          break;

        default:
          var constraintParts = constraintValue.split(";");
          this.firstConstraintValue.set("value", constraintParts[1]);
      }
      this.compareOperatorSelect.set("value", constraintType);

      // CONSTRAINT MESSAGE //
      this.constraintMessage.set("value", this.question.constraintMsg);

      // CHOICES //
      if(this.question.choices) {
        domClass.remove(this.choicesListPane.domNode, "dijitHidden");
        array.forEach(this.question.choices.query(), lang.hitch(this, this.addChoiceUI));
        if(this.question.choicesHasOther) {
          this.addOtherChoice();
        } else {
          this.removeOtherChoice();
        }
        this.updateAppearanceOptions();
        this.updateConstraintOptions();
      } else {
        this.updateTypeOptions();
      }


      // RELEVANT //
      this.relevantPane = new RelevantPane({source: this.question}, put(this.relevantPane.containerNode, "div"));
      this.relevantPane.startup();
      if(this.question.relevant) {
        // TODO: update ui...
      }

      // SET INITIAL FOCUS //
      this.set("editing", true);
    },

    focus: function () {
      this.labelInput.focus();
      this.labelInput.focusNode.select();
    },

    _requiredChange: function (value) {
      this.question.set("required", value);
      this.question.update();
    },
    _labelChange: function (value) {
      this.question.set("label", value);
      this.question.update();

      this.labelRead.innerHTML = value;
    },
    _hintChange: function (value) {
      this.question.set("hint", value);
      this.question.update();
      this.hintRead.innerHTML = value;
    },
    _typeChange: function (value) {
      if(this.question.questionType !== value) {
        this.question.set("questionType", value);
        this.question.update();

        this.updateTypeOptions();
      }
    },
    _appearanceChange: function (value) {
      if(this.question.appearance !== value) {
        this.question.set("appearance", value);
        this.question.update();

        this.updateAppearanceOptions();
      }
    },
    _constraintMessageChange: function (value) {
      this.question.set("constraintMsg", value);
      this.question.update();
    },

    _copy: function () {
      this.set("editing", false);
      this.emit("copy", this.question);
    },

    _delete: function () {
      this.emit("delete", this.question);
    },

    _toggleEditing: function () {
      this.set("editing", (!this.editing));
    },

    _setEditingAttr: function (newValue) {
      //this._set("editing", newValue);
      this.editing = newValue;
      this.containerNode.selectChild(this.editing ? this.editPane : this.readPane);
      if(this.editing) {
        this.focus();
      }
      domClass.toggle(this.domNode, "editing", this.editing);
      topic.publish("survey/editing/change", this.question, this.editing);
    },

    _addNewChoice: function () {
      this.newChoice();
    },

    _addOther: function () {
      this.addOtherChoice();
    },

    _removeOther: function () {
      this.removeOtherChoice();
    },

    /**
     *
     */
    updateTypeOptions: function () {

      // CONSTRAINT //
      this.updateConstraintOptions();
      // APPEARANCE //
      this.updateAppearanceOptions();

      // CHOICES //
      this.choicesListNode.innerHTML = "";
      var mayHaveChoices = (array.indexOf(SurveyQuestion.MAYHAVE_CHOICES, this.question.questionType) > -1 );
      domClass.toggle(this.choicesListPane.domNode, "dijitHidden", !mayHaveChoices);
      if(mayHaveChoices) {
        this.newChoice();
      }
      this.removeOtherChoice();

      this.question.update();
    },

    /**
     *
     */
    updateAppearanceOptions: function () {
      // APPEARANCE //
      domClass.toggle(this.appearancePane.domNode, "dijitHidden", (array.indexOf(SurveyQuestion.MAYHAVE_APPEARANCE, this.question.questionType) === -1 ));
      this.question.update();
    },

    /**
     *
     */
    updateConstraintOptions: function () {
      // CONSTRAINT //
      domClass.toggle(this.constraintPane.domNode, "dijitHidden", (array.indexOf(SurveyQuestion.MAYHAVE_CONSTRAINT, this.question.questionType) === -1));
      this.question.update();
    },

    /**
     *
     * @param value
     * @private
     */
    _constraintOperatorChange: function (value) {
      this.question.set("constraintType", value);

      switch (value) {
        /*
         case "email":
         query(".constraint-option", this.domNode).addClass("dijitHidden");
         query(".constraint-between", this.domNode).addClass("dijitHidden");
         query(".constraint-custom-option", this.domNode).addClass("dijitHidden");
         break;
         */
        case "custom":
          query(".constraint-option", this.domNode).addClass("dijitHidden");
          query(".constraint-between", this.domNode).addClass("dijitHidden");
          query(".constraint-custom-option", this.domNode).removeClass("dijitHidden");
          break;

        case "between":
        case "notbetween":
          query(".constraint-option", this.domNode).removeClass("dijitHidden");
          query(".constraint-between", this.domNode).removeClass("dijitHidden");
          query(".constraint-custom-option", this.domNode).addClass("dijitHidden");
          break;

        default:
          query(".constraint-option", this.domNode).removeClass("dijitHidden");
          query(".constraint-between", this.domNode).addClass("dijitHidden");
          query(".constraint-custom-option", this.domNode).addClass("dijitHidden");
      }

      this.updateConstraintUI();
    },

    /**
     *
     */
    updateConstraintUI: function () {

      var constraintType = this.question.get("constraintType");
      switch (constraintType) {
        /*
         case "email":
         this.question.set("constraint", "regex(., '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}')");
         break;
         */
        case "custom":
          this.question.set("constraint", this.constraintCustom.get("value"));
          break;

        case "between":
          var betweenConstraint = lang.replace(".&gt;={0} and .&lt;={1}", [this.firstConstraintValue.get("value"), this.secondConstraintValue.get("value")]);
          this.question.set("constraint", betweenConstraint);
          break;

        case "notbetween":
          var notBetweenConstraint = lang.replace(".&lt;{0} and .&gt;{1}", [this.firstConstraintValue.get("value"), this.secondConstraintValue.get("value")]);
          this.question.set("constraint", notBetweenConstraint);
          break;

        default:
          var constraintValue = lang.replace(".{0}{1}", [constraintType, this.firstConstraintValue.get("value")]);
          var cleanConstraint = constraintValue.replace(/>/g, "&gt;").replace(/</g, "&lt;");
          this.question.set("constraint", cleanConstraint);
      }

      this.question.update();
    },

    /**
     *
     */
    newChoice: function () {
      var defaultChoiceLabel = this.question.getChoiceName("Choice");
      var newChoice = {
        label: defaultChoiceLabel,
        value: this.question._clean(defaultChoiceLabel)
      };
      this.question.addChoice(newChoice);
      this.addChoiceUI(newChoice);
    },

    /**
     *
     * @param choice
     */
    addChoiceUI: function (choice) {

      var choiceNode = put(this.choicesListNode, "div.choice-node");

      var choiceInput = new TextBox({value: choice.label, intermediateChanges: true}, put(choiceNode, "div"));
      choiceInput.on("change", lang.hitch(this, function (newLabel) {
        choice.label = newLabel;
        this.question.updateChoice(choice);
        this.question.update();
      }));
      choiceInput.on("keypress", lang.hitch(this, function (evt) {
        if(evt.charOrCode === keys.ENTER) {
          this.newChoice();
        }
      }));
      choiceInput.focusNode.select();
      choiceInput.focus();

      var removeNode = put(choiceNode, "span.remove-choice", {innerHTML: "&nbsp;&#10799", title: "Remove choice"});
      on(removeNode, "click", lang.hitch(this, function (evt) {
        put(choiceNode, "!");
        this.question.removeChoice(choice);
        this._updateRemoveNodes();
        this.question.update();
      }));

      this._updateRemoveNodes();
      this.question.update();
    },

    /**
     *
     * @returns {boolean}
     * @private
     */
    _updateRemoveNodes: function () {
      var removeNodes = query(".remove-choice", this.choicesListNode);
      removeNodes.toggleClass("dijitOffScreen", removeNodes.length === 1);
    },

    /**
     *
     */
    addOtherChoice: function () {
      domClass.remove(this.choicesOtherNode, "dijitHidden");
      this.question.set("choicesHasOther", true);
      this.question.update();

      this.otherBtn.set("disabled", true);
    },

    /**
     *
     */
    removeOtherChoice: function () {
      domClass.add(this.choicesOtherNode, "dijitHidden");
      this.question.set("choicesHasOther", false);
      this.question.update();

      this.otherBtn.set("disabled", false);
    },

    /**
     *
     */
    destroy: function () {
      this.question.remove();
      this.inherited(arguments);
    }

  });

  QuestionPane.version = "0.0.1";

  return QuestionPane;
});