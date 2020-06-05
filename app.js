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

var route = new FMRoute();

route.get('/', function (vars, next) {
    App.page.current = 'home';
    route.go('/cardapio');
    next();
});

route.get('/cardapio', function (vars, next) {
    App.page.current = 'cardapio';
    next();
    $('body').scrollspy({ target: '#navCategories' })
});

route.get('/finalizacao', function (vars, next) {
    if (!App.page.pageFinalizacao) {
        route.go('/cardapio');
        return;
    }

    App.page.current = 'finalizacao';
    next();
});

route.get('/whatsapp-link', function (vars, next) {
    if (!App.page.pageWhatsappLink) {
        route.go('/cardapio');
        return;
    }

    App.page.current = 'whatsapp-link';
    next();
});

var App = new Vue({
    el: '#AppVue',
    data: {
        page: {
            current: 'home',
            pageFinalizacao: false,
            pageWhatsappLink: false,
        },
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
                                priceFormatted: '19,99',
                            },
                            {
                                id: 2,
                                name: 'Lanche 2',
                                price: 12.59,
                                priceFormatted: '12,59',
                            },
                            {
                                id: 3,
                                name: 'Lanche 3',
                                price: 25.45,
                                priceFormatted: '25,45',
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
                                priceFormatted: '5,00',
                            },
                            {
                                id: 5,
                                name: 'Fanta',
                                price: 4.00,
                                priceFormatted: '4,00',
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
                name: '',
                phone: '',
                cep: '',
                address: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: '',
                reference: '',
            },
            payment: {
                type: '1',
                diff: '0',
                value: '',
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
        'cart.client.cep': function (a) {
            App.updateCartHash();
        },
        'cart.client.address': function (a) {
            App.updateCartHash();
        },
        'cart.client.number': function (a) {
            App.updateCartHash();
        },
        'cart.client.complement': function (a) {
            App.updateCartHash();
        },
        'cart.client.neighborhood': function (a) {
            App.updateCartHash();
        },
        'cart.client.city': function (a) {
            App.updateCartHash();
        },
        'cart.client.state': function (a) {
            App.updateCartHash();
        },
        'cart.client.reference': function (a) {
            App.updateCartHash();
        },
        'cart.payment.type': function (a) {
            App.updateCartHash();
        },
        'cart.payment.diff': function (a) {
            App.updateCartHash();
        },
        'cart.payment.value': function (a) {
            App.updateCartHash();
        },
    },
    methods: {
        init: function () {
            App.checkLocalStorage();
            App.updateCartHash();
            route.run();
        },

        checkLocalStorage: function () {
            var hash = window.localStorage.getItem('orderHash');
            if (hash) {
                var json = atob(hash);
                var order = JSON.parse(json);

                App.cart.items = order.items;
                App.cart.comments = order.comments;
                App.cart.client = order.client;
                App.cart.payment = order.payment;
            }
        },

        goToPage: function (page) {
            route.go(page);
        },

        goToCategory: function (category) {
            var $category = $(`[data-category-id=${category.id}]`);
            // console.log('$category', $category, $category.scrollTop());
            // console.log('$category', $category, $category.position());
            console.log('$category', $category, $category.offset());

            $('html, body').animate({ scrollTop: $category.offset().top - 80 }, 300);

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

            window.localStorage.setItem('orderHash', App.cart.hash);

            App.validatePages();
            App.updateWhatsappText();
        },

        addProductToCart: function (product, amount) {
            if (typeof amount === 'undefined') amount = null;

            var hasProduct = App.checkIfHasProduct(product);

            if (hasProduct !== null) {
                var currentAmount = App.cart.items[hasProduct].amount;
                var newAmount = amount ? amount : currentAmount + 1;

                var currentPrice = App.cart.items[hasProduct].price
                var newFinalPrice = newAmount * currentPrice;

                App.cart.items[hasProduct].amount = newAmount;
                App.cart.items[hasProduct].finalPrice = newFinalPrice;
                App.cart.items[hasProduct].finalPriceFormatted = number_format(newFinalPrice, 2, ',', '.');
            } else {
                App.cart.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    priceFormatted: product.priceFormatted,
                    amount: 1,
                    finalPrice: product.price,
                    finalPriceFormatted: number_format(product.price, 2, ',', '.'),
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
                items.push(`R$ ${number_format(item.finalPrice, 2, ',', '.')} -> ${item.amount}x ${item.name} (R$ ${number_format(item.price, 2, ',', '.')})`);
                subtotal += item.finalPrice;
            }

            var address = [];

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

        validatePages: function () {
            App.page.pageFinalizacao = false;
            App.page.pageWhatsappLink = false;

            if (App.cart.items.length) {
                App.page.pageFinalizacao = true;
            }

            if (
                App.cart.client.name
                && App.cart.client.phone
                && App.cart.client.cep
                && App.cart.client.address
                && App.cart.client.number
                && App.cart.client.complement
                && App.cart.client.neighborhood
                && App.cart.client.city
                && App.cart.client.state
                && App.cart.client.reference
                && App.cart.payment.type
            ) {
                if (
                    App.cart.payment.type === '1'
                    || (
                        App.cart.payment.type === '2'
                        && (
                            App.cart.payment.diff === '0'
                            || (
                                App.cart.payment.diff === '1'
                                && App.cart.payment.value
                            )
                        )
                    )
                ) {
                    App.page.pageWhatsappLink = true;
                }
            }

            // cart.payment.type
            // cart.payment.diff
            // cart.payment.value
        },

        updateCartItem: function (cartItem) {
            if (cartItem.amount == 0 || !cartItem.amount) {
                cartItem.amount = 1;
            }
            App.addProductToCart(cartItem, cartItem.amount);
        },
    },
});

App.init();
