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

var cartAnimationTimeout = null;

var App = new Vue({
    el: '#AppVue',
    data: {
        page: {
            current: 'home',
            pageFinalizacao: false,
            pageWhatsappLink: false,
            disabled: false,
        },
        categories: [],
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
            phone: '',
            text: '',
            link: '',
        },
    },
    watch: {
        'cart.comments': function (value) {
            App.updateCartHash();
        },
        'cart.client.name': function (value) {
            App.updateCartHash();
        },
        'cart.client.phone': function (value) {
            var newValue = value.replace(/[^\d\s\-]+/g, '').toString();

            if (newValue !== value) {
                App.cart.client.phone = newValue;
            } else {
                App.updateCartHash();
            }
        },
        'cart.client.cep': function (value) {
            var newValue = value.replace(/\D+/g, '').toString();

            if (newValue.length > 8) {
                newValue = newValue.substr(0, 8);
            }

            if (newValue !== value) {
                App.cart.client.cep = newValue;
            } else {
                App.updateCartHash();
            }
        },
        'cart.client.address': function (value) {
            App.updateCartHash();
        },
        'cart.client.number': function (value) {
            App.updateCartHash();
        },
        'cart.client.complement': function (value) {
            App.updateCartHash();
        },
        'cart.client.neighborhood': function (value) {
            App.updateCartHash();
        },
        'cart.client.city': function (value) {
            App.updateCartHash();
        },
        'cart.client.state': function (value) {
            App.updateCartHash();
        },
        'cart.client.reference': function (value) {
            App.updateCartHash();
        },
        'cart.payment.type': function (value) {
            App.updateCartHash();
        },
        'cart.payment.diff': function (value) {
            App.updateCartHash();
        },
        'cart.payment.value': function (value) {
            App.updateCartHash();
        },
    },
    methods: {
        init: function () {
            App.getDb(function () {
                App.checkLocalStorage();
                App.updateCartHash();
                route.run();
            });
        },

        getDb: function (cb) {
            axios.get('/db.json').then(function (response) {
                App.categories = response.data.categories;
                App.whatsapp.phone = response.data.whatsapp.phone;
                cb();
            });
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
            $('html, body').stop().animate({
                scrollTop: 0,
            });
        },

        goToCategory: function (category) {
            var $category = $(`[data-category-id=${category.id}]`);
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

            App.cartAnimate();

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
                items.push(`${item.amount}x ${item.name} (R$ ${number_format(item.price, 2, ',', '.')})
    = R$ ${number_format(item.finalPrice, 2, ',', '.')}
`);
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
                // && App.cart.client.complement
                && App.cart.client.neighborhood
                && App.cart.client.city
                && App.cart.client.state
                // && App.cart.client.reference
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

        newOrder: function () {
            window.localStorage.removeItem('orderHash');
            window.location.replace('/');
        },

        searchCep: function () {
            App.cart.client.cep = App.cart.client.cep.replace(/\D+/g, '');

            if (App.cart.client.cep.length === 8) {
                App.page.disabled = true;
                axios.get(`http://viacep.com.br/ws/${App.cart.client.cep}/json/`).then(function (response) {
                    App.cart.client.address = response.data.logradouro;
                    App.cart.client.neighborhood = response.data.bairro;
                    App.cart.client.city = response.data.localidade;
                    App.cart.client.state = response.data.uf;

                    App.page.disabled = false;
                });
            } else {
                alert('Informe o cep.');
            }
        },

        showCart: function () {
            $('html, body').stop().animate({
                scrollTop: $('#cartHeader').offset().top,
            });
        },

        cartAnimate: function () {
            $('.cart-badge').removeClass('animate__animated').removeClass('animate__animated animate__bounce');
            setTimeout(function () {
                $('.cart-badge').addClass('animate__animated').addClass('animate__animated animate__bounce');
                clearTimeout(cartAnimationTimeout);
                cartAnimationTimeout = setTimeout(function () {
                    $('.cart-badge').removeClass('animate__animated').removeClass('animate__animated animate__bounce');
                }, 1000);
            }, 10);
        },
    },
});

$(document).ready(function () {
    App.init();
});

