Ext.define('Ext.ux.form.RegisterDialog', {
    extend: 'Ext.Panel',
    alias: 'widget.registerdialog',

    requires: [
        'Ext.app.ViewModel',
        'Ext.Container',
        'Ext.form.Panel',
        'Ext.Label',
        'Ext.data.validator.Length',
        'Ext.data.validator.Email',
        'Ext.field.Text',
        'Ext.field.Password',
        'Ext.Button',
        'Ext.ux.plugin.MsgBus'        
    ],

    config: {
        width: 450,
        centered: true,
        modal: true,
        layout: 'vbox',
        bodyBorder: true,
        closeAction: 'hide',
        closable: true,
        
        language: undefined,                // object
        headerPanel: undefined,             // container
        nameContainer: undefined,           // containerfield
        firstnameField: undefined,          // textfield
        lastnameField: undefined,           // textfield
        usernameField: undefined,           // textfield
        passwordField: undefined,           // passwordfield
        capsLockWarning: undefined,         // label
        emailField: undefined,              // textfield
        registerAction: undefined,          // button
        formPanel: undefined,               // formpanel        
    },

    initConfig: function(instanceConfig) {
		var me = this, config = {};

		//Ext.apply(config, instanceConfig);        
        Ext.Object.merge(config, instanceConfig || {});

        config.language = Ext.Object.merge({
            default: 'en-us',
            'en-us': {
                description: 'English - United States',
                title: 'Create account',
                subtitle: 'or <a href=#>Sign in</a>',
                status: '',
                capslockwarning: '<span class="x-fa fa-warning">&nbsp;Caps Lock is On</span>',
                waitmsg: 'Please wait...',
                field: {
                    label: {
                        name: 'Name',
                        firstname: 'First',
                        username: 'Username',
                        password: 'Password',
                        lastname: 'Last',
                        email: 'Email'
                    }
                },
                button: {
                    text: {
                        register: 'Submit'
                    }
                }
            }
        }, config.language);

        config = Ext.Object.merge({
            referenceHolder: true,

            viewModel: {
                data: config.language[config.language.default]
            },

            headerPanel: {
                xtype: 'container',
                cls: 'register-dialog-header',
                height: 110,
                html: '&nbsp;',
                bind: {
                    html: '{title}',
                },
                items: [{
                    xtype: 'label',
                    html: '&nbsp;',
                    bind: {
                        html: '{subtitle}'
                    }
                }, {
                    xtype: 'label',
                    reference: 'status',
                    cls: 'register-dialog-status',
                    html: '&nbsp;',
                    bind: {
                        html: '{status}'
                    }
                }]
            },

            firstnameField: {
                xtype: 'textfield',
                reference: 'field-firstname',
                name: 'first_name',
                flex: 1,
                bind: {
                    placeholder: '{field.label.firstname}'
                },
                maxLength: 255,
                required: true,
                errorTarget: 'under',
                validators: {
                    type: 'length',
                    max: 255
                }
            },

            lastnameField: {
                xtype: 'textfield',
                reference: 'field-lastname',
                name: 'last_name',
                flex: 1,
                bind: {
                    placeholder: '{field.label.lastname}'
                },
                maxLength: 255,
                required: true,
                errorTarget: 'under',
                validators: {
                    type: 'length',
                    max: 255
                }
            },

            nameContainerField: {
                xtype: 'containerfield',
                bind: {
                    label: '{field.label.name}'
                },
                items: []
            },

            usernameField: {
                xtype: 'textfield',
                reference: 'field-username',
                name: 'username',
                bind: {
                    label: '{field.label.username}'
                },
                maxLength: 255,
                required: true,            
                errorTarget: 'under',
                validators: {
                    type: 'length',
                    min: 3,
                    max: 255
                },
            },

            passwordField: {
                xtype: 'passwordfield',
                reference: 'field-password',
                name: 'password',
                bind: {
                    label: '{field.label.password}'
                },
                maxLength: 255,
                required: true,
                errorTarget: 'under',
                validators: {
                    type: 'length',
                    min: 8,
                    max: 255
                },
                listeners: {
                    keyup: {
                        fn: function(field, e, eOpts) {
                            if(e.key().length === 1) {  // cannot use e.getCharCode() in keyup
                                var charCode = e.key().charCodeAt(0);
                                if((e.shiftKey && charCode >= 97 && charCode <= 122) ||
                                    (!e.shiftKey && charCode >= 65 && charCode <= 90)) {
                                    
                                    this.lookupReference('panel-form').lookupReference('capslockwarning').setBind({
                                        html: '{capslockwarning}'
                                    });
                                } else {
                                    this.lookupReference('panel-form').lookupReference('capslockwarning').setBind({
                                        html: null
                                    });
                                }
                            }
                        },
                        scope: me
                    }
                }
            },

            capsLockWarning: {
                xtype: 'label',
                reference: 'capslockwarning',
                cls: 'register-dialog-capslockwarning',
                html: ''
            }, 

            emailField: {
                xtype: 'textfield',
                reference: 'field-email',
                name: 'email',
                bind: {
                    label: '{field.label.email}'
                },
                maxLength: 255,
                validators: {
                    type: 'email'
                },
                required: true,            
                errorTarget: 'under'
            },

            registerAction: {
                xtype: 'button',
                reference: 'action-register',
                cls: 'register-dialog-action-register',
                text: '&nbsp;',
                bind: {
                    text: '{button.text.register}',
                },
                buttonType: 'submit',
                scope: this,
                handler: this.submit
            },

            formPanel: {
                xtype: 'formpanel',
                reference: 'panel-form',
                referenceHolder: true,
                cls: 'register-dialog-form',
                flex: 1,
                bodyPadding: 10,
                items: [],
                listeners: {
                    painted: function(sender, element, eOpts) {
                        sender.clearErrors();
                        Ext.each(Ext.ComponentQuery.query('[xtype=textfield]', sender), function(item, index, allItems) {
                            if(!item.getValue()) {
                                item.focus(true);
                                return false;
                            }
                        });
                    }
                }
            },

            plugins: {
                msgbus: true
            }
        }, config);

        config.nameContainerField.items = (config.nameContainerField.items || []).concat([
            config.firstnameField,
            config.lastnameField
        ]);        

        config.formPanel.items = (config.formPanel.items || []).concat([
            config.headerPanel,
            config.nameContainerField,
            config.usernameField,
            config.passwordField,
            config.capsLockWarning,
            config.emailField
        ]);
        config.formPanel.buttons = (config.formPanel.buttons || []).concat(['->', config.registerAction]);

        config.items = [config.formPanel].concat(config.items || []);
        
        return me.callParent([config]);
    },

    listeners: {
        painted: {single: true, fn: function(sender, element, eOpts) {
            if(sender.findPlugin('msgbus')) {
                sender.subscribe('user.language.*', {fn:function(message, config) {
                    switch(message) {
                        case 'user.language.switch':
                            this.setLanguage(config.language);
                        break;
                    }
                }});
            }
        }}
    },

    setStatus: function(msg) {
        var headerPanel = this.lookupReference('panel-form').lookupReference('status').setHtml(msg);
    },

    setLanguage: function(code, languageConfig) {
        languageConfig = languageConfig || {};

        var formPanel = this.lookupReference('panel-form');
        
        Ext.Object.merge(this.config.language, languageConfig);
        
        if(code in this.config.language) {            
            this.viewModel.setData(this.config.language[code]);                        
            Ext.defer(function() {
                formPanel.fireEvent('painted', formPanel, formPanel.element);
            }, 10, formPanel);

            return true;
        }
        return false;
    },

    submit: function () {
        var formPanel = this.lookupReference('panel-form');

		if (formPanel.validate()) {
			formPanel.submit({
                url: formPanel.getUrl(),
				method: formPanel.getMethod(),
				waitMsg: this.viewModel.getData().waitmsg,
				success: this.onSuccess,
				failure: this.onFailure,
				scope: this
			});
		}
    },
    
    onSuccess: function (form, result, data) {
        var formPanel = this.lookupReference('panel-form');
        formPanel.lookupReference('field-password').setValue('');
        formPanel.clearErrors();

        this.fireEvent('success', this, form, result, data);
        if(this.findPlugin('msgbus')) {
            this.publish('user.register.success', {form: form, result: result, data: data});
        }
        
        this.close();
	},

	onFailure: function (form, result) {
        var errorMsgs = this.viewModel.getData().field.validation
        var formPanel = this.lookupReference('panel-form');
        var status = '';

        if('errors' in result) {
            formPanel.setErrors(result.errors);
        }

        if('message' in result) {
            status = result.message;
        } else {
            status = 'status' in result ? status + result['status'] : status;
            status = 'request' in result ? status + ': ' + result.request.url : status;
            status = 'statusText' in result ? status + ' - ' + result['statusText'] : status;
        }

        this.setStatus(status);

        this.fireEvent('failure', this, form, result);
        if(this.findPlugin('msgbus')) {
            this.publish('user.register.failure', {form: form, result: result});
        }
    }
});