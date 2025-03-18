"""
As discussed, we are currently writing prototypes using *Panel*.

Here is an example of the way we write our tools. You can run this using

`panel serve TestApp.py`

and then go to https://urldefense.com/v3/__http://localhost:5006/TestApp__;!!Fx_w9onFedniDnwLAw!kuIdHW8r7SLc6SFTxs2nixVljFACYbXtEziG8KVJ1uU2znE1tbN3p6-nLGVlR-aB9aNxxZFVwhm2d0mSffH-3iJzIsklkAWFcA$ 

The assignment is to give us a plan to transform this look and feel into a 'native' look and field. Currently, all the
business logic has been written and we do not want to re-write everything (if we can avoid that). We are open to
writing a few end-points if that is necessary.

Feel free to write code, or just delineate a plan.

For questions, please email me at mauricio.karchmer@lazard.com
"""

import asyncio

import panel as pn
import pandas as pd
import numpy as np
import altair as alt

import param

pn.extension('vega')


class Spinner(pn.viewable.Viewer):

    def __init__(self, model, **kwargs):
        super().__init__(**kwargs)
        self.model = model

    def __panel__(self):

        def get_spinner(busy):
            if not busy:
                return None
            return pn.pane.Markdown("<span style='color:red;'>in process...</span>")

        return pn.bind(get_spinner, self.model.param.busy)


class POCControlModel(param.Parameterized):

    chart_type = param.Selector(default='line', objects=['line', 'bar'])
    n = param.Integer(default=50)

    refresh = param.Event(default=False, precedence=-1)
    busy = param.Boolean(default=False, precedence=-1)

    def set_busy(self, busy):
        self.busy = busy


class POCControl(pn.viewable.Viewer):

    def __init__(self, model, **kwargs):
        super().__init__(**kwargs)
        self.model = model

    def __panel__(self):
        button = pn.widgets.Button.from_param(self.model.param.refresh, name='show')

        spinner = Spinner(self.model)
        return pn.Column(
                pn.Param(self.model.param, name=''),
                button,
                spinner,
        )


class POCModel(param.Parameterized):

    name = param.String()

    refresh = param.Event(default=False, allow_refs=True, precedence=-1)

    chart_type = param.String(allow_refs=True)
    n = param.Integer(allow_refs=True)

    df = param.DataFrame(allow_None=True, default=None, precedence=-1)
    plot = param.ClassSelector(class_=alt.Chart, allow_None=True, default=None, precedence=-1)

    busy = param.Boolean(default=False, precedence=-1)
    msg = param.String(default='', precedence=-1)

    @param.depends('refresh', 'n', watch=True)
    async def _set_data(self):
        """
        all the business logic is in generated the data.
        Everything else can be moved to the front end if needed.
        """
        self.busy = True
        self.msg = 'Working'
        dates = pd.date_range('20230101', periods=self.n)
        await asyncio.sleep(2)
        self.df = pd.DataFrame({
            'date': dates,
            'value': np.random.randn(self.n).cumsum()
        })
        self.busy = False
        self.msg = ''

    @param.depends('df', 'chart_type', watch=True)
    def _set_plot(self):
        """
        Here we use Altair (a wrap around vega-light). We have found the need to use other
        libraries (like eCharts) as Altair does not offer all the chart types we need.

        In the past, I have used d3 to write custom charts. We want to keep as much flexibility as possible.
        """
        if self.df is None:
            return
        self.busy = True
        self.msg = 'Getting plot'
        base = alt.Chart(self.df)

        chart = base.mark_bar() if self.chart_type == 'bar' else base.mark_line()
        chart = chart.encode(
            x='date:T',
            y='value:Q'
        ).properties(
            title='Random Data Plot',
            width=600,
            height=400
        )
        self.plot = chart
        self.busy = False
        self.msg = ''


class POCPanel(pn.viewable.Viewer):

    def __init__(self, model, **kwargs):
        super().__init__(**kwargs)
        self.model = model

    def __panel__(self):

        def get_plot(plot):
            if plot is None:
                return None
            return pn.pane.Vega(plot)

        content = pn.Column(
            pn.bind(get_plot, self.model.param.plot),
        )

        return content


class App:

    def run(self):

        cm = POCControlModel()
        c = POCControl(cm)

        pm = POCModel(name='One',
                      refresh=cm.param.refresh,
                      n=cm.param.n,
                      chart_type=cm.param.chart_type
                      )
        p = POCPanel(pm)
        pn.bind(cm.set_busy, pm.param.busy, watch=True)

        template = pn.template.BootstrapTemplate(site="Tesseract", title="Test")

        side = pn.Column(c)
        template.sidebar.append(side)

        main = pn.Column(p)
        template.main.append(main)

        template.servable()


app = App()
app.run()
