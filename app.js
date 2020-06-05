function number_format(number, decimals, decPoint, thousandsSep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    var s = ''

    var toFixedFix = function (n, prec) {
        if (('' + n).indexOf('e') === -1) {
            return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
        } else {
            var arr = ('' + n).split('e')
            var sig = ''
            if (+arr[1] + prec > 0) {
                sig = '+'
            }
            return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
        }
    }

    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }

    return s.join(dec)
}


var App = new Vue({
    el: '#AppVue',
    data: {
        categories: {
            list: [
                {
                    id: 1,
                    name: 'Lanches',
                    products: {
                        list: [
                            {
                                id: 1,
                                name: 'Lanche 1',
                                price: 19.99,
                            },
                            {
                                id: 2,
                                name: 'Lanche 2',
                                price: 12.59,
                            },
                            {
                                id: 3,
                                name: 'Lanche 3',
                                price: 25.45,
                            },
                        ],
                    },
                },
                {
                    id: 2,
                    name: 'Bebidas',
                    products: {
                        list: [
                            {
                                id: 4,
                                name: 'Coca',
                                price: 5.00,
                            },
                            {
                                id: 5,
                                name: 'Fanta',
                                price: 4.00,
                            },
                        ],
                    },
                },
            ],
        },
        cart: {
            items: [],
            comments: '',
            client: {
                name: 'name',
                phone: 'phone',
                cep: 'cep',
                address: 'address',
                number: 'number',
                complement: 'complement',
                neighborhood: 'neighborhood',
                city: 'city',
                state: 'state',
                reference: 'reference',
            },
            payment: {
                value: '2',
                diff: 0,
            },
            hash: '',
        },
        whatsapp: {
            phone: '5511987391075',
            text: '',
            link: '',
            // https://api.whatsapp.com/send?phone=5511987391075&text=
        },
    },
    watch: {
        'cart.comments': function (a) {
            App.updateCartHash();
        },
        'cart.client.name': function (a) {
            App.updateCartHash();
        },
        'cart.client.phone': function (a) {
            App.updateCartHash();
        },
    },
    methods: {
        init: function () {
            App.updateCartHash();
        },

        checkIfHasProduct: function (product) {
            var hasProduct = null;
            for (var i in App.cart.items) {
                var item = App.cart.items[i];

                if (item.id == product.id) {
                    hasProduct = i;
                }
            }

            return hasProduct;
        },

        updateCartHash: function () {
            var items = App.cart.items;
            var comments = App.cart.comments;
            var client = App.cart.client;
            var payment = App.cart.payment;

            var order = {
                items,
                comments,
                client,
                payment,
            };

            var json = JSON.stringify(order);
            var b64 = btoa(json);
            App.cart.hash = b64;

            App.updateWhatsappText();
        },

        addProductToCart: function (product) {
            var hasProduct = App.checkIfHasProduct(product);

            if (hasProduct !== null) {
                var currentAmount = App.cart.items[hasProduct].amount;
                var newAmount = currentAmount + 1;

                var currentPrice = App.cart.items[hasProduct].price
                var newFinalPrice = newAmount * currentPrice;

                App.cart.items[hasProduct].amount = newAmount;
                App.cart.items[hasProduct].finalPrice = newFinalPrice;
            } else {
                App.cart.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    amount: 1,
                    finalPrice: product.price,
                });
            }

            App.updateCartHash();
        },

        removeProductFromCart: function (product) {
            var hasProduct = App.checkIfHasProduct(product);

            if (hasProduct !== null) {
                App.cart.items.splice(hasProduct, 1);
            }

            App.updateCartHash();
        },

        updateWhatsappText: function () {

            var items = [];
            var subtotal = 0;
            for (var i in App.cart.items) {
                var item = App.cart.items[i];
                items.push(`R$ ${number_format(item.finalPrice, 2, ',', '.')} -> ${item.amount}x Lanche 1 (R$ ${number_format(item.price, 2, ',', '.')})`);
                subtotal += item.finalPrice;
            }

            var address = [];

            // Rua A, 123, Bloco B, Jardim Lalala, Mogi, SP - 08745-250

            if (App.cart.client.address) address.push(App.cart.client.address);
            if (App.cart.client.number) address.push(App.cart.client.number);
            if (App.cart.client.complement) address.push(App.cart.client.complement);
            if (App.cart.client.neighborhood) address.push(App.cart.client.neighborhood);
            if (App.cart.client.city) address.push(App.cart.client.city);
            if (App.cart.client.state) address.push(App.cart.client.state);

            address = address.join(', ');
            if (App.cart.client.cep) address += ' - ' + App.cart.client.cep;

            var tax = 4;

            var total = subtotal + tax;

            var newText = `*RESUMO DO PEDIDO*

${items.join('\n')}

*Subtotal:* R$ ${number_format(subtotal, 2, ',', '.')}

----------------------------------

*DADOS PARA ENTREGA*

*Nome:* ${App.cart.client.name}
*Telefone:* ${App.cart.client.phone}

*Endereço:* ${address}
*Ponto de Referência:* ${App.cart.client.reference}

*Taxa de Entrega:* R$ ${number_format(tax, 2, ',', '.')}

----------------------------------

*TOTAL:* R$ R$ ${number_format(total, 2, ',', '.')}`;

            App.whatsapp.text = newText;

            App.updateWhatsappLink();
        },

        updateWhatsappLink: function () {
            var newLink = encodeURI(`https://api.whatsapp.com/send?phone=${App.whatsapp.phone}&text=${App.whatsapp.text}`);
            App.whatsapp.link = newLink;
        },
    },
});

App.init();


// var route = new FMRoute();

// route.get('/', function (vars, next) {
//     console.log('rota', '/');
//     route.go('/cardapio');
//     next();
// });

// route.get('/cardapio', function (vars, next) {
//     console.log('rota', '/cardapio');
//     next();
// });

// route.get('/finalizacao', function (vars, next) {
//     console.log('rota', '/finalizacao');
//     next();
// });

// route.get('/visualizar/:hash', function (vars, next) {
//     console.log('rota', '/visualizar', vars.hash);
//     next();
// });

// route.run();
