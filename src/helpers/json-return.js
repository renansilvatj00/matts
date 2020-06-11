module.exports = (function () {
    function JsonReturn() {
        this.code = 200;
        this.error = false;
        this.messages = [];
        this.form = {};
        this.content = {};

        this.hasForm = false;
        this.hasContent = false;
    }

    JsonReturn.prototype.setCode = function (code) {
        this.code = code;
        return this;
    };

    JsonReturn.prototype.getCode = function () {
        return this.code;
    };

    JsonReturn.prototype.setError = function (error) {
        this.error = error;
        return this;
    };

    JsonReturn.prototype.addMessage = function (message) {
        this.messages.push(message);
        return this;
    };

    JsonReturn.prototype.addContent = function (key, value) {
        this.content[key] = value;
        this.hasContent = true;
        return this;
    };

    JsonReturn.prototype.addFields = function (fields) {
        for (let i in fields) {
            const field = fields[i];
            this.addField(field);
        }

        return this;
    };

    JsonReturn.prototype.addField = function (field) {
        this.form[field] = {
            error: false,
            messages: [],
        };
        this.hasForm = true;

        return this;
    };

    JsonReturn.prototype.setFieldError = function (field, error, message) {
        if (typeof message === 'undefined') {
            message = null;
        }

        this.form[field].error = error;

        if (message) {
            this.addFieldMessage(field, message);
        }

        return this;
    };

    JsonReturn.prototype.addFieldMessage = function (field, message) {
        this.form[field].messages.push(message);
        return this;
    };

    JsonReturn.prototype.generate = function () {
        const obj = {};

        obj.code = this.code;
        obj.error = this.error;
        obj.messages = this.messages;
        if (this.hasForm) obj.form = this.form;
        if (this.hasContent) obj.content = this.content;

        return obj;
    };

    return JsonReturn;
})();
