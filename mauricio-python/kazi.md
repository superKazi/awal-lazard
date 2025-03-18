# Plan to transform the look and feel of TestApp

Thanks for sharing the test script. I actually learned a lot by poking through it and `param` and `panel` are pretty cool libraries that remind me of react and observable.

## Two-Part Plan

1. **Python Backend:** This would contain all the necessary business logic from the app that I have included below. It could be served via websockets or set up as a rest API that would response to GET requests from the front-end. I would recommend setting up the server via [FastAPI](https://fastapi.tiangolo.com) because the API is similar to [Express](https://expressjs.com) a Node.js server library I am familiar with and it is well maintained.

```python
import pandas as pd
import numpy as np
import asyncio

async def generate_data(n_points):
    # Generate random time series data
    dates = pd.date_range('20230101', periods=n_points)

    # uncomment next line if we want to add extra delay
    # await asyncio.sleep(2)

    # Create the dataframe
    df = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%dT%H:%M:%S'),
        'value': np.random.randn(n_points).cumsum()
    })

    # Format data for JSON response
    the_data = {
        'data': df.to_dict(orient='records'),
        'meta': {
            'n_points': n_points
        }
    }

    return the_data
```

2. **Native HTML CSS JS Frontend using React component library**:
   - Given the nature of the app — potentially deep sessions, live updates, and lots of data — I would recommend setting it up as React app using [visx](https://airbnb.io/visx), [react-query](https://tanstack.com/query/latest/docs/framework/react/overview), and [react-aria-components](https://react-spectrum.adobe.com/react-aria/index.html).
   - These are battle tested libraries that let you eject gracefully from them if you need to since they are just low level declarative abstractions over d3.js and imperative native web apis.
   - React also makes sense here because it maintains the reactive programming mental model used in the original python script. This way other technical stakeholders should be able to understand the front-end code more quickly if they need to.
   - Because of the robustness of the javascript ecosystem we can quickly prototype and explore UI/UX prototypes based on requirements gathering from product stakeholders. There is no shortage of excellent UI libraries that support react if we want to explore options outside of react-aria: [shadcn](https://ui.shadcn.com), [radix](https://www.radix-ui.com), etc. And the makers of d3 have their own config based charting library called [plot](https://observablehq.com/plot/).
   - By detaching the backend from the front-end we could also explore existing industry leading chart-making tools like [Datawrapper](https://www.datawrapper.de) or [Flourish](https://flourish.studio) that accept data from api endpoints and expose their own. This could allow non-technical stakeholders to prototype charts they'd like to see using the built in guis and cms' those tools offer. Depending on how closely these charting libraries meet requirements, they could even just be deployed as the final product embedded in the front-end.

## Benefits

- **Flexible**: We can eventually create multiple frontends if we need to (mobile native, mobile web, desktop web)
- **Potential to scale**: The API can scale independently from the frontend if that becomes a concern
- **Stepped Migration**: Once established the frontend components can be updated independent of each other instead of everything needing to be rewritten all at once. We can partner with PMs to define the path we take here.

Let me know if you have any questions about what I've outlined!
