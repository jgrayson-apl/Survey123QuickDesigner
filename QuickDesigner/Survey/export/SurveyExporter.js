/**
 *
 * xFromExporter
 *  - Export SurveyForm as xForm
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  2/24/2015 - 0.1.0 -
 * Modified:
 *
 */
define([
  "dojo/_base/declare",
  "dojo/Evented",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/json",
  "dojo/dom-attr",
  "dojo/request/script",
  "put-selector/put",
  "dojox/data/dom",
  "dojox/xml/DomParser",
  "../items/SurveyQuestion"
], function (declare, Evented, lang, array, json, domAttr, script, put, domData, domParser, SurveyQuestion) {

  // CLASS //
  var SurveyExporter = declare([Evented], {

    // CLASS NAME //
    declaredClass: "SurveyExporter",

    // XFORM NAMESPACES //
    xFormNamespaces: [
      {namespace: "xmlns", "url": "http://www.w3.org/2002/xforms"},
      {namespace: "xmlns:ev", "url": "http://www.w3.org/2001/xml-events"},
      {namespace: "xmlns:h", "url": "http://www.w3.org/1999/xhtml"},
      {namespace: "xmlns:jr", "url": "http://openrosa.org/javarosa"},
      {namespace: "xmlns:orx", "url": "http://openrosa.org/xforms/"},
      {namespace: "xmlns:xsd", "url": "http://www.w3.org/2001/XMLSchema"}
    ],

    // XFORM NODE TEXT //
    _xFormDocTemplate: '<?xml version="1.0"?><h:html {0}></h:html>',
    _xFormDocAsText: "",


    /**
     * CONSTRUCTOR
     */
    constructor: function (options) {
      declare.safeMixin(this, options);

      // LOAD BEAUTIFY SCRIPT //
      script.get("./Survey/export/vkbeautify.0.99.00.beta.js");

      // XFORM NAMESPACES ARRAY //
      var namespacesArray = array.map(this.xFormNamespaces, lang.hitch(this, function (xFormNamespace) {
        // ADD XFORM NAMESPACES TO PUT-SELECTOR //
        put.addNamespace(xFormNamespace.namespace, xFormNamespace.url);
        // NAMESPACE AND URL AS TEXT //
        return lang.replace('{namespace}="{url}"', xFormNamespace);
      }));

      // XFORM NODE AS TEXT //
      this._xFormDocAsText = lang.replace(this._xFormDocTemplate, [namespacesArray.join(" ")]);

      // TODO: CREATE ONLY ONE DOCUMENT INSTANCE...
    },

    /**
     *
     * @param surveyForm {SurveyForm}
     * @returns {{xFormDoc: HTMLDocument, modelNode: *, formNode: *, bodyNode: *}}
     * @private
     */
    _createXForm: function (surveyForm) {

      // TODO: CREATE ONLY ONE DOCUMENT INSTANCE... //

      // PARSE INITIAL XFORM NODE //
      var xFormDoc = domData.createDocument(this._xFormDocAsText);
      // GET HTML NODE FROM XML DOC //
      var htmlNode = xFormDoc.firstChild;

      // HEAD NODE //
      var headNode = put(htmlNode, "head");
      // TITLE NODE //
      put(headNode, "title", lang.replace("{title}", surveyForm));

      // MODEL, INSTANCE, AND FORM NODES //
      var modelNode = put(headNode, "xmlns|model");
      var instanceNode = put(modelNode, "xmlns|instance");
      var formNode = put(instanceNode, lang.replace('xmlns|{name}[id="{id}"]', surveyForm));

      // BODY NODE //
      var bodyNode = put(htmlNode, "body");

      return {
        xFormDoc: xFormDoc,
        modelNode: modelNode,
        formNode: formNode,
        bodyNode: bodyNode
      };
    },


    /**
     *  INSERT CHILD NODES
     *
     * @param item
     * @param surveyForm
     * @param formModelNode
     * @param parentFormNode
     * @param parentBodyNode
     */
    _insertNodes: function (item, surveyForm, formModelNode, parentFormNode, parentBodyNode) {

      var items = surveyForm.getChildren(item);
      array.forEach(items, lang.hitch(this, function (childItem) {

        // ITEM FORM NODE //
        var itemFormNode = put(parentFormNode, lang.replace("xmlns|{name}", childItem));

        // TYPE OF ITEM //
        switch (childItem.type) {

          // QUESTION //
          case "Question":

            // MODEL BIND NODE //
            var questionModelNode = put(formModelNode, lang.replace('xmlns|bind[nodeset="{0}"][type="{1}"]', [childItem.get("nodeset"), childItem.questionType]));

            // SPECIAL CASE - note //
            if(childItem.questionType === "note") {
              put(questionModelNode, "!");
              questionModelNode = put(formModelNode, lang.replace('xmlns|bind[nodeset="{0}"][readonly="true()"][type="string"]', [childItem.get("nodeset")]));
              //domAttr.set(questionModelNode, "type", "string");
              //domAttr.set(questionModelNode, "readonly", "true()");
              // NOTE: CAN'T USE domAttr for 'readonly' AS DOJO WILL CAMELCASE INTO 'readOnly' AND THEN XForm WON'T TREAT CORRECTLY...
              // PROBABLY DUE TO THIS: https://bugs.dojotoolkit.org/ticket/8344
              // SEE CODE HERE: https://github.com/dojo/dojo/blob/master/dom-attr.js#L32
            }

            // SPECIAL CASE - image //
            if(childItem.questionType === "image") {
              domAttr.set(questionModelNode, "type", "binary");
            }

            // REQUIRED //
            if(childItem.required) {
              domAttr.set(questionModelNode, "required", "true()");
            }

            // CONSTRAINTS //
            if((array.indexOf(SurveyQuestion.MAYHAVE_CONSTRAINT, childItem.questionType) > -1)) {
              if(childItem.constraint) {
                domAttr.set(questionModelNode, "constraint", childItem.constraint);
                domAttr.set(questionModelNode, "constraintMsg", childItem.constraintMsg);
              }
            }

            // RELEVANT //
            if(childItem.relevant) {
              domAttr.set(questionModelNode, "relevant", childItem.relevantValue);
            }

            // BODY //
            switch (childItem.questionType) {
              // SELECT & SELECT1 //
              case "select":
              case "select1":
                var selectsBodyNode = put(parentBodyNode, lang.replace("xmlns|{0}[ref={1}]", [childItem.questionType, childItem.get("nodeset")]));
                if(childItem.appearance !== "default") {
                  domAttr.set(selectsBodyNode, "appearance", childItem.appearance);
                }
                put(selectsBodyNode, "xmlns|label", childItem.label);
                if(childItem.hint) {
                  put(selectsBodyNode, "xmlns|hint", childItem.hint);
                }

                // SELECT CHOICES //
                if(childItem.choices) {
                  array.forEach(childItem.choices.query(), lang.hitch(this, function (choiceItem) {
                    put(selectsBodyNode, "xmlns|item xmlns|label $ <xmlns|value $", choiceItem.label, choiceItem.value);
                  }));
                  if(childItem.choicesHasOther) {
                    put(selectsBodyNode, "xmlns|item xmlns|label $ <xmlns|value $", "Other", "other");
                  }
                } else {
                  console.warn("Question should have choices: ", childItem);
                }
                break;

              // GEOPOINT //
              case "geopoint":
                var geopointBodyNode = put(parentBodyNode, lang.replace("xmlns|input[ref={0}]", [childItem.get("nodeset")]));
                put(geopointBodyNode, "xmlns|label", childItem.label);
                if(childItem.hint) {
                  put(geopointBodyNode, "xmlns|hint", childItem.hint);
                }
                if(childItem.appearance !== "default") {
                  domAttr.set(geopointBodyNode, "appearance", childItem.appearance);
                }
                break;

              // IMAGE //
              case "image":
                var imageBodyNode = put(parentBodyNode, lang.replace('xmlns|upload[mediatype="image/*"][ref={0}]', [childItem.get("nodeset")]));
                put(imageBodyNode, "xmlns|label", childItem.label);
                if(childItem.hint) {
                  put(imageBodyNode, "xmlns|hint", childItem.hint);
                }
                break;

              // ALL THE REST //
              default:
                var itemBodyNode = put(parentBodyNode, lang.replace("xmlns|input[ref={0}]", [childItem.get("nodeset")]));
                put(itemBodyNode, "xmlns|label", childItem.label);
                if(childItem.hint) {
                  put(itemBodyNode, "xmlns|hint", childItem.hint);
                }
            }
            break;

          // GROUP //
          case "Group":

            // MODEL BIND NODE //
            var groupModelNode = put(formModelNode, lang.replace('xmlns|bind[nodeset="{0}"]', [childItem.get("nodeset")]));

            // RELEVANT //
            if(childItem.relevant) {
              domAttr.set(groupModelNode, "relevant", childItem.relevantValue);
            }

            // BODY //
            var groupBodyNode = put(parentBodyNode, lang.replace("xmlns|group[ref={0}]", [childItem.get("nodeset")]));
            put(groupBodyNode, "xmlns|label", childItem.label);
            if(childItem.hint) {
              put(groupBodyNode, "xmlns|hint", childItem.hint);
            }

            // IS REPEAT //
            if(childItem.type === "Repeat") {
              // FORM //
              domAttr.set(itemFormNode, "jr:template", "");
              // REPEAT //
              groupBodyNode = put(groupBodyNode, lang.replace("xmlns|repeat[nodeset={0}]", [childItem.get("nodeset")]))
            }

            // RECURSIVELY INSERT CHILD NODES //
            this._insertNodes(childItem, surveyForm, formModelNode, itemFormNode, groupBodyNode);

            break;
        }
      }));

    },

    /**
     *
     * @param surveyForm {SurveyForm}
     * @returns {DOMDocument}
     */
    toXMLDoc: function (surveyForm) {
      // SURVEY AS XFORM XML //
      var xFormDetails = this._createXForm(surveyForm);
      // RECURSIVELY INSERT CHILD NODES STARTING WITH SURVEY FORM //
      this._insertNodes(surveyForm, surveyForm, xFormDetails.modelNode, xFormDetails.formNode, xFormDetails.bodyNode);
      // SURVEY AS XFORM XML DOCUMENT //
      return xFormDetails.xFormDoc;
    },

    /**
     *
     * @param surveyForm
     * @param prettify
     * @returns {string}
     */
    toXMLText: function (surveyForm, prettify) {
      // SURVEY AS XML DOCUMENT //
      var surveyAsXMLDoc = this.toXMLDoc(surveyForm);
      // SURVEY AS XML TEXT //
      var innerXMLAsText = domData.innerXML(surveyAsXMLDoc);
      // RETURN SURVEY AS XML TEXT - TABBED OR PLAIN //
      return (prettify && vkbeautify) ? vkbeautify.xml(innerXMLAsText, 1) : innerXMLAsText;
    },

    /**
     *
     * @param surveyForm
     * @param prettify
     * @returns {string}
     */
    toXmlJsonText: function (surveyForm, prettify) {
      // SURVEY AS XML TEXT //
      var surveyAsXmlText = this.toXMLText(surveyForm);
      var surveyAsXmlJson = domParser.parse(surveyAsXmlText);
      // RETURN SURVEY AS XML JSON TEXT //
      var itemCache = [];
      return json.stringify(surveyAsXmlJson, function (key, value) {
        if(typeof value === 'object' && value !== null) {
          if(itemCache.indexOf(value) !== -1) {
            return;
          }
          itemCache.push(value);
        }
        return value;
      }, prettify ? " " : null);
    },

    /**
     *
     * @param surveyForm
     * @param prettify
     * @returns {string}
     */
    toJsonText: function (surveyForm, prettify) {
      // SURVEY AS XML JSON //
      var surveyAsJson = surveyForm.toJson();
      // RETURN SURVEY AS XML JSON TEXT //
      return json.stringify(surveyAsJson, null, prettify ? " " : null);

    },

    /**
     *
     * @param surveyForm
     * @returns {*}
     */
    toDownloadInfo: function (surveyForm) {

      // CREATE XFORM //
      var xFormDetails = this._createXForm(surveyForm);

      // RECURSIVELY INSERT CHILD NODES STARTING WITH SURVEY FORM //
      this._insertNodes(surveyForm, surveyForm, xFormDetails.modelNode, xFormDetails.formNode, xFormDetails.bodyNode);

      // INNERXML AS TEXT //
      var innerXMLAsText = domData.innerXML(xFormDetails.xFormDoc);

      // REVOKE OBJECT URL //
      if(this.xFormFile !== null) {
        window.URL.revokeObjectURL(this.xFormFile);
      }
      // CREATE OBJECT URL //
      var xFormFilename = lang.replace("{0}.xml", [surveyForm.name]);
      var xFormBlob = new Blob([innerXMLAsText], {type: "octet/stream"});
      this.xFormFile = window.URL.createObjectURL(xFormBlob);

      // RETURN DOWNLOAD INFO //
      return {
        filename: xFormFilename,
        blob: xFormBlob,
        href: this.xFormFile
      };
    },

    /**
     *
     * @param surveyForm
     */
    publishAsService: function (surveyForm) {

      alert("Not Implemented Yet");

      /*
       var downloadInfo = this.toDownloadInfo(surveyForm);

       // FORMDATA //
       var webForm = put("form", {
       "method": "post",
       "enctype": "multipart/form-data"
       });
       var formData = new FormData(webForm);
       formData.append("file", downloadInfo.blob, downloadInfo.filename);

       // POST SERVICE //
       esriRequest({
       url: "some url that will do great magical things",
       form: formData,
       content: {
       f: "json"
       },
       handleAs: "json"
       },{
       usePost: true
       }).then(lang.hitch(this, function (response) {

       alert("Success: " + response.success)

       }), lang.hitch(this, function (error) {
       console.warn(error);
       }));
       */

    }

  });

  // VERSION //
  SurveyExporter.version = "0.0.1";

  // RETURN CLASS //
  return SurveyExporter;
});
  

