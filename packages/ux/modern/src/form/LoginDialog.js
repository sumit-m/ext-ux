Ext.define('Ext.ux.form.LoginDialog', {
    extend: 'Ext.Panel',
    alias: 'widget.logindialog',

    requires: [
        'Ext.app.ViewModel',
        'Ext.Container',
        'Ext.form.Panel',
        'Ext.Label',
        'Ext.field.Text',
        'Ext.field.Password',
        'Ext.field.Select',
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
        usernameField: undefined,           // textfield
        passwordField: undefined,           // passwordfield
        capsLockWarning: undefined,         // label
        forgotPasswordAction: undefined,    // button
        languageField: undefined,           // combobox
        loginAction: undefined,             // button
        formPanel: undefined,               // formpanel        
    },

    initConfig: function(instanceConfig) {
		var me = this, config = {};

		//Ext.apply(config, instanceConfig);        
        Ext.Object.merge(config, instanceConfig || {});

        config.language = Ext.Object.merge({
            default: 'en-us',
            'en-us': {
                title: 'Sign in',
                subtitle: 'or <a href=#>Create account</a>',
                status: '',
                capslockwarning: '<span class="x-fa fa-warning">&nbsp;Caps Lock is On</span>',
                waitmsg: 'Please wait...',
                field: {
                    label: {
                        username: 'Username',
                        password: 'Password',
                        language: 'Language'
                    },
                    validation: {
                        required: {
                            username: 'Enter a username',
                            password: 'Enter a password'
                        }
                    }
                },
                button: {
                    text: {
                        forgotpassword: 'Forgot Password ?',
                        login: 'Login'
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
                cls: 'login-dialog-header',
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
                    cls: 'login-dialog-status',
                    html: '&nbsp;',
                    bind: {
                        html: '{status}'
                    }
                }]
            },
    
            usernameField: {
                xtype: 'textfield',
                reference: 'field-username',
                name: 'username',
                bind: {
                    label: '{field.label.username}',
                    requiredMessage: '{field.validation.required.username}'
                },
                maxLength: 255,
                required: true,            
                errorTarget: 'under'
            },
            
            passwordField: {
                xtype: 'passwordfield',
                reference: 'field-password',
                name: 'password',
                bind: {
                    label: '{field.label.password}',
                    requiredMessage: '{field.validation.required.password}'
                },
                maxLength: 255,
                required: true,
                errorTarget: 'under',
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
                cls: 'login-dialog-capslockwarning',
                html: ''
            },
    
            forgotPasswordAction: {
                xtype: 'button',
                reference: 'action-forgotpassword',
                cls: 'login-dialog-action-forgotpassword',
                text: '&nbsp;',
                bind: {
                    text: '{button.text.forgotpassword}',
                },
                ripple: false,
                focusCls: ''
            },
    
            languageField: {
                xtype: 'selectfield',
                reference: 'field-language',
                name: 'language',
                bind: {
                    label: '{field.label.language}',
                },
                value: config.language.default,
                editable: false,
                queryMode: 'local',
                displayField: 'label',
                valueField: 'code',
                store: {
                    xtype: 'store',
                    fields: ['code', 'label'],
                    data: [{
                        code: 'en-us',
                        label: 'English - United States'
                    }, {
                        code: 'it',
                        label: 'Italiano‬'
                    }]
                },
                listeners: {
                    change: {
                        fn: function(field, newValue, oldValue, eOpts) {
                            if(this.findPlugin('msgbus')) {
                                this.publish('user.language.switch', {language: field.getValue()}, true);
                            } else {
                                this.setLanguage(field.getValue());                            
                            }
                            this.fireEvent('switchLanguage', this, field.getValue());
                        }
                    },
                    scope: me
                }
            },
    
            loginAction: {
                xtype: 'button',
                reference: 'action-login',
                cls: 'login-dialog-action-login',
                text: '&nbsp;',
                bind: {
                    text: '{button.text.login}',
                },
                buttonType: 'submit',
                handler: this.submit,
                scope: this
            },
            
            formPanel: {
                xtype: 'formpanel',
                reference: 'panel-form',
                referenceHolder: true,
                cls: 'login-dialog-form',
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
        
        config.formPanel.items = (config.formPanel.items || []).concat([
            config.headerPanel,
            config.usernameField,
            config.passwordField,
            config.capsLockWarning, {
                xtype: 'container',
                layout: 'hbox',
                items: [{xtype: 'spacer'}, config.forgotPasswordAction]
            },                
            config.languageField
        ]);
        config.formPanel.buttons = (config.formPanel.buttons || []).concat(['->', config.loginAction]);

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
        var languageField = formPanel.lookupReference('field-language');

        Ext.Object.merge(this.config.language, languageConfig);
        
        if((code in this.config.language) && 
            (languageField.getStore().query('code', code, false, false, true).length > 0)) {

            if(languageField.getValue() !== code) {
                languageField.setValue(code);
            } else {
                this.viewModel.setData(this.config.language[code]);                        
                Ext.defer(function() {
                    formPanel.fireEvent('painted', formPanel, formPanel.element);
                }, 10, formPanel);
            }
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
            this.publish('user.login.success', {form: form, result: result, data: data});
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
            this.publish('user.login.failure', {form: form, result: result});
        }
    }
});