/**
 * SaveLoadEngine is responsible for automatic and manual save and load operations.
 *
 * @class SaveLoadEngine
 * @constructor
 */

function unescapeRestData (dataNode) {
    // http://stackoverflow.com/questions/4480757/how-do-i-unescape-html-entities-in-js-change-lt-to
    var tempNode = document.createElement('div');
    tempNode.innerHTML = dataNode.textContent.replace(/&amp;/, '&');
    return tempNode.innerText || tempNode.text || tempNode.textContent;
}


var ProbandDataLoader = Class.create( {
    initialize: function() {
        this.probandData = undefined;
    },

    load: function(callWhenReady) {       
        new Ajax.Request(XWiki.currentDocument.getRestURL('objects/PhenoTips.PatientClass/0'), {
            method: "GET",
            onSuccess: this.onProbandDataReady.bind(this),
            onComplete: callWhenReady ? callWhenReady : {}
        });
    },

    onProbandDataReady : function(response) {
        var data = response.responseXML.documentElement;
        this.probandData = {};        
        this.probandData.firstName = unescapeRestData(data.querySelector("property[name='first_name'] > value"));
        this.probandData.lastName  = unescapeRestData(data.querySelector("property[name='last_name'] > value"));
        this.probandData.gender    = unescapeRestData(data.querySelector("property[name='gender'] > value")); 
        if (this.probandData.gender == '')
            this.probandData.gender = 'U';
        console.log("Proband data: " + stringifyObject(this.probandData));
    },
});


var SaveLoadEngine = Class.create( {

    initialize: function() {
        this._saveInProgress = false;
    },

    /**
     * Saves the state of the graph
     *
     * @return Serialization data for the entire graph
     */
    serialize: function() {
        return editor.getGraph().toJSON();
    },

    createGraphFromSerializedData: function(JSONString, noUndo, centerAround0) {
        console.log("---- load: parsing data ----");
        var successfulLoad = false;

        document.fire("pedigree:load:start");

        try {
            var positionedGraph = editor.getGraph(); 

            var changeSet = positionedGraph.fromJSON(JSONString);

            if (!noUndo) {
                var probandData = editor.getProbandDataFromPhenotips();
                var genderOk = positionedGraph.setProbandData( probandData.firstName, probandData.lastName, probandData.gender );
                if (!genderOk)
                    alert("Gender defined in phenotips is incompatible with this pedigree. Setting proband gender to 'Unknown'");
            }

            if (editor.getGraphicsSet().applyChanges(changeSet, false)) {
                successfulLoad = true;
                editor.getWorkspace().adjustSizeToScreen();
            }

            if (centerAround0)
                editor.getWorkspace().centerAroundNode(0);

            if (!noUndo)
                editor.getActionStack().addState(null, null, JSONString);
        }
        catch(err)
        {
            console.log("ERROR loading the graph: " + err);
        }

        document.fire("pedigree:load:finish");
        return successfulLoad;
    },

    save: function() {
        if (this._saveInProgress)
            return;   // Don't send parallel save requests

        var me = this;

        var jsonData = this.serialize();
        
        console.log("saving, data: " + stringifyObject(jsonData));        
        
        var image = $('canvas');
        var background = image.getElementsByClassName('panning-background')[0];
        var backgroundPosition = background.nextSibling;
        var backgroundParent =  background.parentNode;
        backgroundParent.removeChild(background);
        var bbox = image.down().getBBox();
        var savingNotification = new XWiki.widgets.Notification("Saving", "inprogress");
        new Ajax.Request(XWiki.currentDocument.getRestURL('objects/PhenoTips.PedigreeClass/0', 'method=PUT'), {
            method: 'POST',
            onCreate: function() {
                me._saveInProgress = true;
            },
            onComplete: function() {
                me._saveInProgress = false;
            },
            onSuccess: function() {savingNotification.replace(new XWiki.widgets.Notification("Successfuly saved"));},
            parameters: {"property#data": jsonData, "property#image": image.innerHTML.replace(/xmlns:xlink=".*?"/, '').replace(/width=".*?"/, '').replace(/height=".*?"/, '').replace(/viewBox=".*?"/, "viewBox=\"" + bbox.x + " " + bbox.y + " " + bbox.width + " " + bbox.height + "\" width=\"500\" height=\"500\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"")}
        });
        backgroundParent.insertBefore(background, backgroundPosition);        
    },

    load: function() {
        console.log("initiating load process");

        new Ajax.Request(XWiki.currentDocument.getRestURL('objects/PhenoTips.PedigreeClass/0/'), {
            method: 'GET',
            onCreate: function() {
                document.fire("pedigree:load:start");
            },
            onSuccess: function (response) {
                //console.log("Data from LOAD: " + stringifyObject(response));
                console.log("[Data from LOAD]");
                var rawdata = response.responseXML.documentElement.querySelector("property[name='data'] > value");
                var jsonData = unescapeRestData(rawdata);
                if (jsonData.trim()) {
                    console.log("recived JSON: " + stringifyObject(jsonData));
                    this.createGraphFromSerializedData(jsonData);
                } else {
                    new TemplateSelector(true);
                }
            }.bind(this)
        })
    }
});