var BView = (function () {
  'use strict';

  /*!
    BView v0.1.1
    (c) 2023 github.com/splendidexponent
    License: MIT
   */
  class BView {
    constructor(el){
      this.el = el;

      // https://backbonejs.org/#View-constructor
      this.initialize(el);

      if(BView.debug){
        console.log(this.constructor.name, 'instantiated el:', this.el);
      }

      this.delegateEvents();
      this.setEls();
      this.render();
    }

    // https://backbonejs.org/#View-delegateEvents
    delegateEvents(){
      if(!this.events) return;

      // Remove previous delegated events, if any
      if(this.__events_fn && Object.keys(this.__events_fn).length > 0){
        this.undelegateEvents();
      } else {
        this.__events_fn = {};
      }

      for (const event_key in this.events) {
        const method_name = this.events[event_key];
        const event_key_parts = event_key.match(/([^\s]+)\s(.*)/);

        // handle "click" without any selector. click event on el itself. ie. event_key_parts == null
        const event_on_el_itself = event_key_parts == null;

        const event_name = event_on_el_itself ? event_key : event_key_parts[1];
        const event_el_selector = event_on_el_itself ? null : event_key_parts[2];
        
        this.__events_fn[method_name] = (e) => {
          if(
            event_on_el_itself || 
            this.arrContains(this.qAll(event_el_selector), e.target)
          ){
            if(BView.debug){
              console.log(this.constructor.name, `"${event_key}: ${method_name}" triggered, target:`, e.target, 'el:', this.el);
            }

            this[method_name](e);
          }
        };

        // Set events on el, handled with event bubbling.
        this.el.addEventListener(event_name, this.__events_fn[method_name]);
      }

      if(BView.debug){
        console.log(this.constructor.name, 'delegating events el:', this.el);
      }
    }

    // https://backbonejs.org/#View-undelegateEvents
    undelegateEvents(){
      if(!this.events || !this.__events_fn) return;

      for (const event_key in this.events) {
        const method_name = this.events[event_key];
        const event_key_parts = event_key.match(/([^\s]+)\s(.*)/);
        // handle "click" without any selector. click event on el. ie. event_key_parts == null
        const event_name = event_key_parts == null ? event_key : event_key_parts[1];

        this.el.removeEventListener(event_name, this.__events_fn[method_name]);
        delete this.__events_fn[method_name];
      }

      if(BView.debug){
        console.log(this.constructor.name, 'undelegating events el:', this.el);
      }
    }

    // Helper methods. KEY_el() will return reference element with KEY.
    // Not in backbone
    setEls(){
      if(!this.els) return;

      if(BView.debug){
        var function_list = [];
      }

      for (const name in this.els) {
        // This must be a function, as DOM within el could change at anytime.
        Object.defineProperty(this, `${name}_el`, {
          get: ()=>this.q(this.els[name])
        });

        if(BView.debug){
          function_list.push('this.' + name + '_el');
        }
      }

      if(BView.debug){
        console.log(this.constructor.name, 'reference element functions:', function_list.join(), 'el:', this.el);
      }
    }

    // Find element within el. Similar to jQuery this.$el.find().
    // https://backbonejs.org/#View-$el
    q(query){
      return this.el.querySelector(query);
    }

    // Find all elements within el. Similar to jQuery this.$el.find().
    // https://backbonejs.org/#View-$el
    qAll(query){
      return this.el.querySelectorAll(query);
    }

    // Checks if given element is present in an array. (Works on node_list)
    arrContains(arr, element){
      for (let i = 0; i < arr.length; i++) {
        if(element === arr[i]){
          return true;
        }
      }

      return false;
    }

    initialize(){
      // default no-op
    }

    render(){
      // default no-op
    }


    // Sync
    static debug = false;
    static viewClasses = {};
    static viewInstances = [];

    static addViewClass(viewClass){
      this.viewClasses[viewClass.name] = viewClass;

      if(BView.debug){
        console.log('BView Sync:', 'Added View Class', viewClass.name);
      }

      this.sync();
    }

    static sync(){
      // Select all uninitialized views
      const els = document.querySelectorAll('[data-view]:not([data-view-initialized])');

      // Instantiate
      els.forEach((el)=>{
        if(!this.viewClasses[el.dataset.view]) return;

        const instance = new this.viewClasses[el.dataset.view](el);
        el.dataset.viewInitialized = 'true';

        this.viewInstances.push({
          instance: instance,
          el: el
        });
      });

      // Remove instances that are not in dom
      this.viewInstances = this.viewInstances.filter((viewInstance)=>{
        if(document.body.contains(viewInstance.el) == false){
          if(BView.debug){
            console.log('BView Sync:', 'Removing', viewInstance.instance.constructor.name , 'instance for el:', viewInstance.el);
          }

          viewInstance.instance.undelegateEvents();
          delete viewInstance.instance;
          delete viewInstance.el;
          return false;
        }

        return true;
      });
    }

    // Start
    static start(){
      const observer = new MutationObserver(function(){
        BView.sync();
      });

      document.addEventListener('DOMContentLoaded', function(){
        BView.sync();
        observer.observe(document, { childList: true, subtree: true });
      });
    }
  }

  return BView;

})();
