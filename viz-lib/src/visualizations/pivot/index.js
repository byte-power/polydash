import { merge } from "lodash";

import Renderer from "./Renderer";
import Editor from "./Editor";

const addSeparators = function (nStr, thousandsSep, decimalSep) {
  const x = String(nStr).split('.');
  let x1 = x[0];
  const x2 = x.length > 1 ? decimalSep + x[1] : '';
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, `$1${thousandsSep}$2`);
  }
  return x1 + x2;
};

const numberFormat = function (opts_in) {
  const defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ',',
    decimalSep: '.',
    prefix: '',
    suffix: '',
  };
  const opts = Object.assign({}, defaults, opts_in);
  return function (x) {
    if (isNaN(x) || !isFinite(x)) {
      return '';
    }
    const result = addSeparators(
      (opts.scaler * x).toFixed(opts.digitsAfterDecimal),
      opts.thousandsSep,
      opts.decimalSep
    );
    return `${opts.prefix}${result}${opts.suffix}`;
  };
};

const usFmt = numberFormat();

const usFmtInt = numberFormat({ digitsAfterDecimal: 0 });

const aggregatorTemplates = {
  count(formatter = usFmtInt) {
    return () =>
      function () {
        return {
          count: 0,
          push() {
            this.count++;
          },
          value() {
            return this.count;
          },
          format: formatter,
        };
      };
  },

  sum(formatter = usFmt) {
    return function ([attr]) {
      return function () {
        return {
          sum: 0,
          push(record) {
            if (!isNaN(parseFloat(record[attr]))) {
              this.sum += parseFloat(record[attr]);
            }
          },
          value() {
            return this.sum;
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  },

  runningStat(mode = 'mean', ddof = 1, formatter = usFmt) {
    return function ([attr]) {
      return function () {
        return {
          n: 0.0,
          m: 0.0,
          s: 0.0,
          push(record) {
            const x = parseFloat(record[attr]);
            if (isNaN(x)) {
              return;
            }
            this.n += 1.0;
            if (this.n === 1.0) {
              this.m = x;
            }
            const m_new = this.m + (x - this.m) / this.n;
            this.s = this.s + (x - this.m) * (x - m_new);
            this.m = m_new;
          },
          value() {
            if (mode === 'mean') {
              if (this.n === 0) {
                return 0 / 0;
              }
              return this.m;
            }
            if (this.n <= ddof) {
              return 0;
            }
            switch (mode) {
              case 'var':
                return this.s / (this.n - ddof);
              case 'stdev':
                return Math.sqrt(this.s / (this.n - ddof));
              default:
                throw new Error('unknown mode for runningStat');
            }
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  }

};

aggregatorTemplates.average = f =>
  aggregatorTemplates.runningStat('mean', 1, f);

const aggregators = (tpl => ({
  Count: tpl.count(usFmtInt),
  Sum: tpl.sum(usFmt),
  Average: tpl.average(usFmt)
}))(aggregatorTemplates);

const DEFAULT_OPTIONS = {
  controls: {
    enabled: false, // `false` means "show controls" o_O
  },
  rendererOptions: {
    table: {
      colTotals: true,
      rowTotals: true,
    },
  },
  aggregators: aggregators,
  aggregatorTemplates: aggregatorTemplates
};


export default {
  type: "PIVOT",
  name: "Pivot Table",
  getOptions: options => merge({}, DEFAULT_OPTIONS, options),
  Renderer,
  Editor,

  defaultRows: 10,
  defaultColumns: 3,
  minColumns: 2,
};
