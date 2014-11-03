/**
 * Moye (Zhixin UI)
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @file 弹框组件
 * @author mengke(mengke01@baidu.com)
 */

define(function (require) {

    var $ = require('jquery');
    var lib = require('./lib');
    var Control = require('./Control');

    /**
     * 对目标字符串进行格式化
     * 从tangram中抽出
     * @see http://1.5.13-tangram.baidu.com.r.bae.baidu.com:8081
     * /api.html#baidu.string.format|tangram
     *
     * @param {string} source 目标字符串
     * @param {...(Object|string)} opts 提供相应数据的对象或多个字符串
     * @return {string} 格式化后的字符串
     * @inner
     */
    function format(source, opts) {
        source = String(source);
        var data = Array.prototype.slice.call(arguments, 1);
        var toString = Object.prototype.toString;
        if (data.length) {
            // ie 下 Object.prototype.toString.call(null) == '[object Object]'
            data = data.length === 1
            ? (
                opts !== null
                    && /\[object (Array|Object)\]/.test(toString.call(opts))
                ? opts
                : data
            )
            : data;
            return source.replace(/#\{(.+?)\}/g, function (match, key) {
                var replacer = data[key];
                // chrome 下 typeof /a/ == 'function'
                if ('[object Function]' === toString.call(replacer)) {
                    replacer = replacer(key);
                }
                return ('undefined' === typeof replacer ? '' : replacer);
            });
        }
        return source;
    }


    /**
     * 遮罩层管理类，提供遮罩层的操作函数
     *
     * @requires lib
     * @requires Dialog
     * @module Mask
     */
    var Mask = lib.newClass(/** @lends module:Mask.prototype */{

        /**
         * 初始化函数
         *
         * @private
         * @param {Object} opts 初始化选项
         * @see module:Mask.create
         * @private
         */
        initialize: function (opts) {
            this.mask = $('<div>')
                .addClass(opts.className)
                .css(opts.styles)
                .appendTo(document.body)
                .get(0);

            Mask.curMasks++;

            if (6 === lib.browser.ie && !Mask.ie6frame) {
                var frame = ''
                    + '<iframe'
                    + ' src="about:blank"'
                    + ' frameborder="0"'
                    + ' style="position:absolute;left:0;top:0;z-index:1;'
                    + 'filter:alpha(opacity=0)"'
                    + '></iframe>';
                Mask.ie6frame = $(frame)
                    .appendTo(document.body)
                    .get(0);
            }
        },

        /**
         * 重新绘制遮盖层的位置
         * 参考esui2
         *
         * @see https://github.com/erik168/ER/blob/master/src/esui/Mask.js
         * @public
         */
        repaint: function () {

            var doc = $(document);
            var width = doc.width();
            var height = doc.height();

            $(this.mask).css({
                width: width,
                height: height
            });

            if (Mask.ie6frame) {
                $(Mask.ie6frame).css({
                    width: width,
                    height: height
                });
            }

        },

        /**
         * 显示一个遮罩层
         *
         * @public
         */
        show: function () {
            if (Mask.ie6frame) {
                $(Mask.ie6frame)
                    .css('z-index', this.mask.style.zIndex - 1)
                    .show();
            }
            $(this.mask).show();
        },

        /**
         * 隐藏一个遮罩层
         *
         * @public
         */
        hide: function () {
            if (Mask.ie6frame) {
                $(Mask.ie6frame).hide();
            }
            $(this.mask).hide();
        },

        /**
         * 注销一个遮罩层
         *
         * @public
         */
        dispose: function () {
            $(this.mask).remove();
            Mask.curMasks--;

            if (Mask.curMasks <= 0 && Mask.ie6frame) {
                $(Mask.ie6frame).remove();
                Mask.curMasks = 0;
                Mask.ie6frame = null;
            }
        }
    });

    /**
     * 当前已经生成的Mask个数
     *
     * @type {number}
     */
    Mask.curMasks = 0;

    /**
     * 创建一个遮罩层
     *
     * @param {Object} options 遮罩选项
     * @param {string} options.id 编号
     * @param {string} options.className 类别名称
     * @param {Object} options.styles 样式集合
     * @return {HTMLElement} 遮罩元素
     */
    Mask.create = function (options) {
        return new Mask(options);
    };

    /**
     * 私有函数或方法
     *
     * @type {Object}
     * @namespace
     * @name module:Dialog~privates
     */
    var privates = /** @lends module:Dialog~privates */ {

        /**
         * 获得指定dialog模块的dom元素
         *
         * @param {string} name 模块名字
         * @return {HTMLElement} 模块的DOM元素
         * @private
         */
        getDom: function (name) {
            return $('.' + this.options.prefix + '-' + name, this.main)[0];
        },

        /**
         * 根据名字构建的css class名称
         *
         * @param {string} name 模块名字
         * @return {string} 构建的class名称
         * @private
         */
        getClass: function (name) {
            name = name ? '-' + name : '';
            var skin = this.options.skin;
            return this.options.prefix + name + (skin ? ' ' + skin + name : '');
        },

        /**
         * 渲染主框架
         *
         * @private
         */
        renderDOM: function () {
            var opt = this.options;
            var data = {
                closeClass: privates.getClass.call(this, 'close'),
                headerClass: privates.getClass.call(this, 'header'),
                bodyClass: privates.getClass.call(this, 'body'),
                footerClass: privates.getClass.call(this, 'footer'),

                title: opt.title,
                content: opt.content,
                footer: opt.footer
            };

            // 渲染主框架内容
            this.main = $('<div>')
                .addClass(privates.getClass.call(this))
                .css({
                    width: opt.width,
                    top: opt.top,
                    position: opt.fixed ? 'fixed' : 'absolute',
                    zIndex: opt.level
                })
                .html(format(this.options.tpl, data))
                .appendTo(document.body)
                .get(0);

            // 如果显示mask，则需要创建mask对象
            if (this.options.showMask) {
                this.mask = Mask.create({
                    className: privates.getClass.call(this, 'mask'),
                    styles: {
                        zIndex: this.options.level - 1
                    }
                });
            }
        },

        /**
         * 绑定组件相关的dom事件
         *
         * @private
         */
        bind: function () {

            // 绑定关闭按钮
            var dom = privates.getDom.call(this, 'close');
            $(dom).on('click', this._bound.onClose);
        },

        /**
         * 获得头部区域的dom元素
         *
         * @return {HTMLElement} 模块的DOM元素
         * @private
         */
        getHeaderDom: function () {
            return privates.getDom.call(this, 'header');
        },

        /**
         * 获得内容区域的dom元素
         *
         * @return {HTMLElement} 模块的DOM元素
         * @private
         */
        getBodyDom: function () {
            return privates.getDom.call(this, 'body');
        },

        /**
         * 获得尾部区域的dom元素
         *
         * @return {HTMLElement} 模块的DOM元素
         * @private
         */
        getFooterDom: function () {
            return privates.getDom.call(this, 'footer');
        },

        /**
         * 处理关闭窗口
         *
         * @param {Event} e 事件对象
         * @private
         */
        onClose: function (e) {
            privates.onHide.call(this, e);
        },

        /**
         * 当视窗大小改变的时候，调整窗口位置
         *
         * @private
         */
        onResize: function () {
            var me = this;
            clearTimeout(me._resizeTimer);
            me._resizeTimer = setTimeout(function () {
                me.adjustPos();
            }, 100);
        },

        /**
         * 当触发展示的时候
         *
         * @param {Event} e 事件对象
         * @fires module:Dialog#beforeshow
         * @private
         */
        onShow: function (e) {
            var me = this;

            /**
             * @event module:Dialog#beforeshow
             * @type {Object}
             * @property {DOMEvent} event 事件源对象
             */
            me.fire('beforeshow', {
                event: e
            });
            me.show();
        },

        /**
         * 当触发隐藏的时候
         *
         * @param {Event} e 事件对象
         * @fires module:Dialog#beforehide
         * @private
         */
        onHide: function (e) {

            /**
             * @event module:Dialog#beforehide
             * @type {Object}
             * @property {DOMEvent} event 事件源对象
             */
            this.fire('beforehide', {
                event: e
            });
            this.hide();
        }

    };

    /**
     * 对话框
     *
     * @extends module:Control
     * @requires lib
     * @requires Control
     * @exports Dialog
     * @example
     * new Dialog({
     *     main: '',
     *     content: '内容',
     *     footer: '底部',
     *     width: '600px',
     *     title: '标题',
     *     top: '50px',
     *     left: '',
     *     fixed: 1,
     *     showMask: 1,
     *     leve: 10
     *
     *  }).render();
     */
    var Dialog = Control.extend(/** @lends module:Dialog.prototype */{

        /**
         * 控件类型标识
         *
         * @type {string}
         * @override
         * @private
         */
        type: 'Dialog',

        /**
         * 控件配置项
         *
         * @name module:Dialog#options
         * @type {Object}
         * @property {(string | HTMLElement)} options.main 控件渲染容器
         * @property {string} options.prefix 控件class前缀，同时将作为main的class之一
         * @property {string} options.title 控件标题
         * @property {string} options.content 控件内容
         * @property {string} options.skin 控件的皮肤
         * @property {string} options.width 控件的默认宽度
         * @property {string} options.top 控件距视窗上边缘的高度，默认为auto，会使组件相对于视窗垂直居中
         * @property {string} options.left 控件距视窗左边缘的宽度，默认为auto，会使组件相对于视窗水平居中
         * @property {string} options.fixed 是否固定，不随视窗滚动
         * @property {string} options.showMask 是否显示覆盖层
         * @property {string} options.level 当前dialog的z-index
         * @property {string} options.dragable 是否可以拖动,暂未实现
         * @property {string} options.tpl 默认的框架模板
         * @property {string} options.footer 控件脚注
         * @private
         */
        options: {

            // 控件渲染主容器,会将容器内的html部分迁移到dialog的body中
            main: '',

            // 控件class前缀，同时将作为main的class之一
            prefix: 'ecl-ui-dialog',

            // 控件标题
            title: '',

            // 控件内容，如果没有指定主渲染容器，则content内容塞到dialog的body中
            content: '',

            // 控件脚注
            footer: '',

            // 控件的皮肤
            skin: '',

            // 控件的默认宽度
            width: '',

            // 控件距视窗上边缘的高度，默认为auto，会使组件相对于视窗垂直居中
            top: '',

            // 控件距视窗左边缘的宽度，默认为auto，会使组件相对于视窗水平居中
            left: '',

            // 是否固定，不随视窗滚动，不支持IE6，IE6自动设置为fixed=0
            fixed: 1,

            // 是否显示覆盖层
            showMask: 1,

            // 当前dialog的z-index
            level: 10,

            // 是否可以拖动,暂未实现
            dragable: 1,

            // 模板框架
            tpl: ''
                + '<div class="#{closeClass}">×</div>'
                + '<div class="#{headerClass}">#{title}</div>'
                + '<div class="#{bodyClass}">#{content}</div>'
                + '<div class="#{footerClass}">#{footer}</div>'
        },

        /**
         * 控件初始化
         *
         * @param {Object} options 控件配置项
         * @see module:Control#options
         * @private
         */
        init: function (options) {
            this._disabled = options.disabled;
            this.bindEvents(privates);
        },


        /**
         * 设置dialog的标题
         *
         * @param {string} content 对话框的标题
         * @public
         */
        setTitle: function (content) {
            privates.getHeaderDom.call(this).innerHTML = content;
        },

        /**
         * 设置dialog的主体内容，可以是HTML内容
         *
         * @param {string} content 内容字符串
         * @public
         */
        setContent: function (content) {
            privates.getBodyDom.call(this).innerHTML = content;
        },

        /**
         * 设置dialog的页脚内容
         *
         * @param {string} content 内容字符串
         * @public
         */
        setFooter: function (content) {
            privates.getFooterDom.call(this).innerHTML = content;
        },

        /**
         * 调整弹窗位置
         * @public
         */
        adjustPos: function () {
            var main = $(this.main);
            var win = $(window);
            var left = this.options.left;
            var top = this.options.top;

            // 如果fixed则需要修正下margin-left
            if (this.options.fixed) {
                var cssOpt = {
                    left: left,
                    top: top
                };

                if (!left) {
                    cssOpt.left = '50%';
                    cssOpt.marginLeft = (-main.width() / 2) + 'px';
                }

                if (!top) {
                    // 这里固定为0.35的位置
                    cssOpt.top = 0.35 * (win.height() - main.height()) + 'px';
                }

                $(this.main).css(cssOpt);
            }

            // absolute则需要动态计算left，top使dialog在视窗的指定位置
            else {

                if (!left) {
                    left = (win.scrollLeft() + (win.width() - main.width()) / 2) + 'px';
                }

                if (!top) {
                    // 这里固定为0.35的位置
                    top = (win.scrollTop() + (win.height() - main.height()) * 0.35) + 'px';
                }

                main.css({
                    position: 'absolute',
                    left: left,
                    top: top
                });
            }

            // 修正mask的遮罩
            this.mask && this.mask.repaint();
        },

        /**
         * 显示组件
         *
         * @return {module:Dialog} 当前实例对象
         * @fires module:Dialog#show
         * @public
         */
        show: function () {

            // 绑定窗口调整事件
            $(window).on('resize', this._bound.onResize);

            // 显示遮罩
            if (this.mask) {
                this.mask.show();
            }


            // 移除hide状态的class
            $(this.main).removeClass(privates.getClass.call(this, 'hide'));

            // 调整位置
            this.adjustPos();

            /**
             * @event module:Dialog#show
             */
            this.fire('show');

            return this;
        },


        /**
         * 隐藏组件
         *
         * @return {module:Dialog} 当前实例对象
         * @fires module:Dialog#hide
         * @public
         */
        hide: function () {
            // 隐藏遮罩
            if (this.mask) {
                this.mask.hide();
            }

            // 添加hide的class
            $(this.main).addClass(privates.getClass.call(this, 'hide'));

            /**
             * @event module:Dialog#hide
             */
            this.fire('hide');

            // 注销resize
            $(window).off('resize', this._bound.onResize);
            clearTimeout(this._resizeTimer);

            return this;
        },

        /**
         * 绘制控件
         *
         * @return {module:Dialog} 当前实例对象
         * @override
         * @public
         */
        render: function () {
            var options = this.options;
            if (!this.rendered) {

                // TODO IE6浏览器不支持fixed定位
                if (options.fixed && 6 === lib.browser.ie) {
                    options.fixed = 0;
                }

                privates.renderDOM.call(this);

                // 设置渲染的内容
                if (options.main) {
                    var ctl = lib.g(options.main);
                    ctl && privates.getBodyDom.call(this).appendChild(ctl);
                }

                privates.bind.call(this);
                this.rendered = true;
            }
            return this;
        },

        /**
         * 调整Dialog大小
         *
         * @return {module:Dialog} 当前实例对象
         * @param {number} width 宽度
         */
        setWidth: function (width) {

            if (!this.rendered || width < 1) {
                return this;
            }

            $(this.main).css({
                width: width + 'px'
            });

            this.adjustPos();

            return this;

        },

        /**
         * 销毁，注销事件，解除引用
         *
         * @public
         * @fires module:Dialog#dispose
         * @fires module:Dialog#beforedispose
         */
        dispose: function () {

            /**
             * @event module:Dialog#beforedispose
             */
            this.fire('beforedispose');

            // 注销dom事件
            var bound = this._bound;

            $(privates.getDom.call(this, 'close')).off('click', bound.onClose);
            $(window).off('resize', bound.onResize);

            clearTimeout(this._resizeTimer);

            // 销毁遮罩
            if (this.mask) {
                this.mask.dispose();
            }

            /**
             * @event module:Dialog#dispose
             */
            this.parent('dispose');

        }
    });

    /**
     * 对话框的遮罩层管理类
     *
     * @type {Mask}
     */
    Dialog.Mask = Mask;

    return Dialog;
});
