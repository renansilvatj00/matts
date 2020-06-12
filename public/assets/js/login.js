var App = new Vue({
    el: '#AppVue',
    data: {
        formLogin: {
            disabled: false,
            error: false,
            messages: [],
            fields: {
                email: {
                    error: false,
                    messages: [],
                    value: '',
                },
                password: {
                    error: false,
                    messages: [],
                    value: '',
                },
            },
        },
    },
    methods: {
        handleFormLoginSubmit: function () {
            App.formLogin.fields.email.error = false;
            App.formLogin.fields.email.messages = [];
            App.formLogin.fields.email.value = App.formLogin.fields.email.value.trim();

            App.formLogin.fields.password.error = false;
            App.formLogin.fields.password.messages = [];
            App.formLogin.fields.password.value = App.formLogin.fields.password.value.trim();

            var error = false;

            if (App.formLogin.fields.email.value == '') {
                error = true;
                App.formLogin.fields.email.error = true;
                App.formLogin.fields.email.messages.push('Campo obrigatório.');
            }

            if (App.formLogin.fields.password.value == '') {
                error = true;
                App.formLogin.fields.password.error = true;
                App.formLogin.fields.password.messages.push('Campo obrigatório.');
            }

            if (!error) {
                App.formLogin.disabled = true;

                axios.post('/api/auth', {
                    email: App.formLogin.fields.email.value,
                    password: App.formLogin.fields.password.value,
                })
                    .then(function (ajaxResponse) {
                        var data = ajaxResponse.data;

                        if (data.content.token) {
                            window.localStorage.setItem('token', data.content.token);
                            window.location.replace('/admin/dashboard');
                        }
                    })
                    .catch(function (ajaxResponse) {
                        var data = ajaxResponse.response.data;

                        App.formLogin.error = data.error;
                        App.formLogin.messages = data.messages;

                        for (var fieldName in data.form) {
                            App.formLogin.fields[fieldName].error = data.form[fieldName].error;
                            App.formLogin.fields[fieldName].messages = data.form[fieldName].messages;
                        }

                        App.formLogin.disabled = false;
                    });
            }
        },
    },
});