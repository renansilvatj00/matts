mixins.push({
    data: {
        product: {
            disabled: false,

            error: false,
            messages: [],

            fields: {
                id: {
                    value: '',
                },
                name: {
                    error: false,
                    messages: [],
                    value: '',
                },
                description: {
                    error: false,
                    messages: [],
                    value: '',
                },
                price: {
                    error: false,
                    messages: [],
                    value: '',
                },
                priceFormatted: {
                    value: '',
                },
            },
        },
        products: {
            list: [],
        },
    },
    methods: {

        initPage: function () {
            App.getProducts();
        },

        getProducts: function () {
            axios.get('/api/products')
                .then(function (ajaxResponse) {
                    var data = ajaxResponse.data;
                    App.getProductsCallback(data);
                    $('#modalManageProduct').modal('hide');
                })
                .catch(function (ajaxResponse) {
                    var data = ajaxResponse.response.data;
                    App.getProductsCallback(data);
                });
        },

        getProductsCallback: function (data) {
            App.products.list = [];

            if (data.content.products) {
                for (i in data.content.products) {
                    var product = data.content.products[i];
                    App.products.list.push(product);
                }
            }
        },

        openModalManageProduct: function (product) {
            App.product.error = false;
            App.product.messages = [];

            if (!product) {
                product = {
                    id: '',
                    name: '',
                    price: '',
                    description: '',
                };
            }

            App.product.fields.id.value = product.id;

            App.product.fields.name.error = false;
            App.product.fields.name.messages = [];
            App.product.fields.name.value = product.name;

            App.product.fields.description.error = false;
            App.product.fields.description.messages = [];
            App.product.fields.description.value = product.description;

            App.product.fields.price.error = false;
            App.product.fields.price.messages = [];
            App.product.fields.price.value = product.price;

            $('#modalManageProduct').modal('show');
        },

        openModalRemoveProduct: function (product) {
            App.product.error = false;
            App.product.messages = [];

            if (!product) {
                product = {
                    id: '',
                    name: '',
                    price: '',
                    description: '',
                };
            }

            App.product.fields.id.value = product.id;

            App.product.fields.name.error = false;
            App.product.fields.name.messages = [];
            App.product.fields.name.value = product.name;

            App.product.fields.description.error = false;
            App.product.fields.description.messages = [];
            App.product.fields.description.value = product.description;

            App.product.fields.price.error = false;
            App.product.fields.price.messages = [];
            App.product.fields.price.value = product.price;
            App.product.fields.priceFormatted.value = product.priceFormatted;

            $('#modalRemoveProduct').modal('show');
        },

        handleManageProductSave: function () {
            App.product.error = false;
            App.product.messages = [];

            App.product.fields.name.error = false;
            App.product.fields.name.messages = [];
            App.product.fields.name.value = App.product.fields.name.value.trim();

            App.product.fields.price.error = false;
            App.product.fields.price.messages = [];
            App.product.fields.price.value = App.product.fields.price.value.trim();

            App.product.fields.description.error = false;
            App.product.fields.description.messages = [];
            App.product.fields.description.value = App.product.fields.description.value.trim();

            var error = false;

            if (App.product.fields.name.value === '') {
                error = true;
                App.product.fields.name.error = true;
                App.product.fields.name.messages.push('Campo obrigatório.');
            }

            if (App.product.fields.price.value === '') {
                error = true;
                App.product.fields.price.error = true;
                App.product.fields.price.messages.push('Campo obrigatório.');
            }

            if (!error) {
                App.product.disabled = true;

                if (App.product.fields.id.value) {
                    var ajax = axios.put(`/api/products/${App.product.fields.id.value}`, {
                        name: App.product.fields.name.value,
                        price: App.product.fields.price.value,
                        description: App.product.fields.description.value,
                    });
                } else {
                    var ajax = axios.post('/api/products', {
                        name: App.product.fields.name.value,
                        price: App.product.fields.price.value,
                        description: App.product.fields.description.value,
                    });
                }

                ajax
                    .then(function (ajaxResponse) {
                        var data = ajaxResponse.data;
                        App.handleManageProductCallbackSave(data);

                        if (data.messages) {
                            alert(data.messages.join(', '));
                        }

                        App.product.fields.id.value = '';
                        App.product.fields.name.value = '';
                        App.product.fields.price.value = '';
                        App.product.fields.description.value = '';

                        App.getProducts();
                        $('#modalManageProduct').modal('hide');
                    })
                    .catch(function (ajaxResponse) {
                        var data = ajaxResponse.response.data;
                        App.handleManageProductCallbackSave(data);
                    });
            }
        },

        handleManageProductCallbackSave: function (data) {
            App.product.error = data.error;
            App.product.messages = data.messages;

            for (var fieldName in data.form) {
                App.product.fields[fieldName].error = data.form[fieldName].error;
                App.product.fields[fieldName].messages = data.form[fieldName].messages;
            }

            App.product.disabled = false;
        },

        handleRemoveProductSave: function () {
            App.product.error = false;
            App.product.messages = [];

            App.product.disabled = true;

            var ajax = axios.delete(`/api/products/${App.product.fields.id.value}`);

            ajax
                .then(function (ajaxResponse) {
                    var data = ajaxResponse.data;
                    App.handleRemoveProductCallbackSave();

                    alert('Produto removido com sucesso.');

                    App.product.fields.id.value = '';

                    App.getProducts();
                    $('#modalRemoveProduct').modal('hide');
                })
                .catch(function (ajaxResponse) {
                    var data = ajaxResponse.response.data;
                    App.handleRemoveProductCallbackSave(data);
                });
        },

        handleRemoveProductCallbackSave: function (data) {
            if (data) {
                App.product.error = data.error;
                App.product.messages = data.messages;
            }

            App.product.disabled = false;
        },

    },
});