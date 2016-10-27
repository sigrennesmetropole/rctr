/*global
 Ext, GeoExt, OpenLayers, GEOR
 */
Ext.namespace("GEOR.Addons");

/*

TODO:
 * fenetre avec grid
 * outil selection ponctuelle
 * formulaire pré-rempli
 * template mail
 * mailto
*/

GEOR.Addons.RCTR = Ext.extend(GEOR.Addons.Base, {

    window: null,
    toggleGroup: '_rctr',
    records: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        this.records = [];
        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: 'button',
                tooltip: this.getTooltip(record),
                iconCls: "addon-rctr",
                handler: this._onCheckchange,
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-rctr",
                checked: false,
                listeners: {
                    "checkchange": this._onCheckchange,
                    scope: this
                }
            });
        }
        this.window = new Ext.Window({
            title: OpenLayers.i18n('rctr.window.title'),
            width: 440,
            height: 500,
            closable: true,
            closeAction: "hide",
            resizable: false,
            border: false,
            layout: 'fit',
            items: {
                layout: 'border',
                border: false,
                items: [{
                    xtype: 'toolbar',
                    region: 'north',
                    border: false,
                    height: 40,
                    items: [
                        new GeoExt.Action({
                            control: new OpenLayers.Control(), // FIXME
                            map: this.map,
                            // button options
                            toggleGroup: this.toggleGroup,
                            allowDepress: false,
                            pressed: false,
                            tooltip: this.tr(""),
                            iconCls: "gx-featureediting-draw-point",
                            text: this.tr("annotation.point"),
                            iconAlign: 'top',
                            // check item options
                            group: this.toggleGroup,
                            checked: false
                        }),'-',
                        new Ext.Action({
                            //handler: this.showForm,
                            scope: this,
                            text: OpenLayers.i18n('rctr.show.form'),
                            //iconCls: "gx-featureediting-export",
                            iconAlign: 'top',
                            tooltip: OpenLayers.i18n('rctr.show.form.tip')
                        })
                    ]
                }, {
                    region: 'center',
                    border: false,
                    xtype: 'panel' // grid
                }]
            },
            listeners: {
                'hide': this._tearDown,
                scope: this
            }
        });
    },

    /**
     * Method: _onCheckchange
     * Callback on checkbox state changed
     */
    _onCheckchange: function(item, checked) {
        if (checked && !this.window.isVisible()) {
            this.window.show();
            this._setUp();
            /*
            this.window.alignTo(
                Ext.get(this.map.div),
                "t-t",
                [0, 5],
                true
            );*/
        } else {
            this.window.hide();
        }
    },


    /**
     * Method: _setUp
     * add layers from a given context to the map
     */
    _setUp: function() {
        // add carroyage layer:
        this._addLayer(this.options.layer, false);
        Ext.each(this.options.baselayers, function(layer) {
            // load WMS baselayers (GWC compatible)
            this._addLayer(layer, true);
        }, this);
    },

    /**
     * Method: _tearDown
     * remove layers from the map
     */
    _tearDown: function() {
        Ext.each(this.records, function(r) {
            this.mapPanel.layers.remove(r);
        }, this);
        this.records = [];
    },

    /**
     * Method: _addLayer
     * 
     */
    _addLayer: function(cfg, isBaseLayer) {
        var layerOptions = isBaseLayer ? {
            gutter: 0,
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(256, 256)
        } : {};
        var u = GEOR.util.splitURL(cfg.service);
        var layerStore = GEOR.ows.WMSCapabilities({
            storeOptions: {
                url: u.serviceURL,
                layerOptions: layerOptions
            },
            baseParams: u.params,
            success: function(store) {
                // extract layer which is expected
                var record = store.queryBy(function(r) {
                    return (r.get('name') == cfg.name);
                }).first();
                if (record) {
                    // set opaque status for layer order:
                    if (isBaseLayer) {
                        record.set("opaque", true);
                    }
                    // enforce format:
                    if (cfg.hasOwnProperty("format")) {
                        record.getLayer().params.FORMAT = cfg.format;
                    }
                    // keep a reference to record:
                    this.records.push(record);
                    // add to map:
                    this.mapPanel.layers.addSorted(record);
                }
                // else silently ignore it
            },
            failure: function() {
                // silently ignore it
            },
            scope: this
        });
    },

    /**
     * Method: tr
     */
    tr: function(str) {
        return OpenLayers.i18n(str);
    },

    /**
     * Method: destroy
     *
     */
    destroy: function() {
        //Place addon specific destroy here
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});