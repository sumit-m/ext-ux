Ext.define('Ext.ux.plugin.MsgBus', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.msgbus',
    requires: [
        'Ext.util.Observable'
    ],

    /**
     * @private {String} busName Name of the global Observable instance
     */
    busName: 'Ext.ux.Bus',
    /**
     * @private
     */
    bus: false,
    /**
     * Initializes the plugin and component
     * @private
     */
    init: function(cmp) {
        this.cmp = cmp;
        cmp.bus = this.getBus();
        cmp.subs = {};
        this.applyConfig();
        this.cmp.on({'beforedestroy': {scope:this.cmp, single:true, fn:function() {
            this.unsubscribeAll();
        }}});
    },
    /**
     * Returns or creates the global Observable instance
     * @private
     */
    getBus:function() {
        var bus = window;
        var a = this.busName.split('.');
        var last = a.pop();

        Ext.each(a, function(n) {
            if(!Ext.isObject(bus[n])) {
                bus = false;
                return false;
            }
            else {
                bus = bus[n];
            }
        }, this);
        if(bus === false) {
            Ext.ns(this.busName);
            return this.getBus();
        }
        if(!(bus[last] instanceof Ext.util.Observable)) {
            bus[last] = new Ext.util.Observable();
        }
        return bus[last];
    },
    /**
     * Creates RegExp for message filtering.
     * Override it if you need another logic.
     * @param {String} subject The message subject
     * @return {RegExp} RegExp used for message filtering
     */
    getFilterRe:function(subject) {
        var a = subject.split('.');
        var last = a.length - 1;
        a[last] = '**' === a[last] ? '.*' : a[last];
        var re = /^\w+$/;
        Ext.each(a, function(token, i) {
            if(!re.test(token) && '*' !== token && '.*' !== token) {
                throw 'Invalid subject: ' + subject;
            }
            if('*' === token) {
                a[i] = '\\w+';
            }
        });
        return new RegExp('^' + a.join('\\.') + '$');
    },
    /**
     * Applies new methods to the component
     * @private
     */
    applyConfig:function() {
        Ext.applyIf(this.cmp, {
            /**
             * Subscribes to messages (parent component method)
             * @param {String} subject Dotted notation subject with wildcards.
             * See http://www.openajax.org/member/wiki/OpenAjax_Hub_2.0_Specification_Topic_Names
             * @param {Object} config Same as addListener config object
             * @return {Boolean} success true on success, false on failure (subscription exists)
             */
             subscribe: function(subject, config) {
                var sub = this.subs[subject];
                if(sub) {
                    return false;
                }
                config = config || {};
                config.filter = this.getFilterRe(subject);
                this.subs[subject] = {config:config, fn:Ext.Function.bind(this.filterMessage, this, [config], true)};
                this.bus.on('message', this.subs[subject].fn, config.scope || this, config);
                //this.mon(this.bus, 'message', this.subs[subject].fn, config.scope || this, config);

                if(this.bus.recur instanceof Ext.util.MixedCollection) {
                    this.bus.recur.eachKey(function(key, item, index, len) {
                        Ext.Function.bind(this.filterMessage, this, [config], true)(key, item, config);
                    }, this);
                }

                return true;
            },

            /**
             * Unsubscribes from messages (parent component method)
             * @param {String} subject Dotted notation subject with wildcards.
             * @return {Boolean} success true on success, false on failure (nonexistent subscription)
             */
            unsubscribe: function(subject) {
                var sub = this.subs[subject];
                if(!sub) {
                    return false;
                }
                this.bus.un('message', sub.fn, sub.scope || this, sub.config);
                delete this.subs[subject];
                sub = null;
                return true;
            },

            unsubscribeAll: function() {
                Ext.iterate(this.subs, function(key, value) {
                    this.unsubscribe(key);
                }, this);
            },

            /**
             * Publishes the message (parent component method)
             * @param {String} subject Message subject
             * @param {Mixed} message Message body, most likely an object
             * @param {Boolean} recur (optional) publish message for every new subscription
             */
            publish: function(subject, message, recur) {
                recur = recur || false;

                this.getFilterRe(subject);
                this.bus.fireEvent('message', subject, message);

                if(recur === true) {
                    if(!(this.bus.recur instanceof Ext.util.MixedCollection)) {
                        this.bus.recur = new Ext.util.MixedCollection();
                    }
                    this.bus.recur.add(subject, message);
                }
            },

            /**
             * Returns current subscriptions
             * @return {Object} subscriptions
             */
            getSubscriptions: function() {
                return this.subs;
            },

            /**
             * @private
             */
            getFilterRe: this.getFilterRe,

            /**
             * Filters incoming messages
             * @private
             */
            filterMessage: function(subject, message, config) {
                if(config.filter.test(subject)) {
                    (config.fn || this.onMessage).call(config.scope || this, subject, message);
                }
            },

            /**
             * Default message processing function
             * @param {String} subject The message subject
             * @param {Mixed} message The message body
             */
            onMessage:Ext.emptyFn
        });
    }
});