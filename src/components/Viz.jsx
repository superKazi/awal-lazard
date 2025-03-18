import { Fragment } from "react";
import { AxisBottom, AxisRight, AxisTop } from "@visx/axis";
import { scaleUtc, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { extent, bisector } from "d3";
import { Line, LinePath, Circle } from "@visx/shape";
import { MarkerCircle } from "@visx/marker";
import { useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { VizAnnotation } from "./VizAnnotation";
import { Stocks } from "./Stocks";
import "./viz.css";

const bisectDate = bisector((d) => new Date(+d.timestamp)).center;

export const Viz = ({
  width,
  height,
  timeFormatter,
  priceTickFormatter,
  percentTickFormatter,
  timeAccessor,
  priceAccessor,
  percentChangeAccessor,
  selectedCharts,
  data,
}) => {
  let { showTooltip, hideTooltip, tooltipData, updateTooltip } = useTooltip();
  let isMultipleCharts = selectedCharts.length > 1;
  let timeDomain = extent(data.get(selectedCharts[0]), timeAccessor);
  let priceDomain = extent(data.get(selectedCharts[0]), priceAccessor);
  let percentDomain = isMultipleCharts
    ? extent(
        selectedCharts
          .map((chart) => {
            let extents = extent(data.get(chart), percentChangeAccessor);
            let modifiedExtent = extents.map((item, index) => {
              if (index === 0) {
                return item - 1;
              }
              if (index === 1) {
                return item + 1;
              }
            });
            return modifiedExtent;
          })
          .flat(),
      )
    : [0, 0];

  let timeScale = scaleUtc({
    domain: timeDomain,
    range: [20, width - 150],
    nice: {
      interval: "minute",
      step: 30,
    },
  });

  let pricePercentScale = scaleLinear({
    domain: isMultipleCharts ? percentDomain : priceDomain,
    range: [height - 40, 40],
    nice: true,
  });

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        onMouseEnter={showTooltip}
        onMouseMove={(e) => {
          let { x } = localPoint(e) || { x: 0 };
          let invertedTime = timeScale.invert(x);
          let indexes = selectedCharts.map((chart) =>
            bisectDate(data.get(chart), invertedTime),
          );
          let pointerData = selectedCharts.map((chart, index) => {
            let tooltipInfo = data.get(chart)[indexes[index]];
            tooltipInfo.x = timeScale(+tooltipInfo.timestamp);
            tooltipInfo.y = isMultipleCharts
              ? pricePercentScale(+tooltipInfo.percentChange)
              : pricePercentScale(+tooltipInfo.price);
            return tooltipInfo;
          });
          updateTooltip({
            tooltipData: pointerData,
          });
        }}
        onMouseLeave={hideTooltip}
      >
        {/* axes */}
        <AxisTop
          scale={timeScale}
          top={40}
          hideAxisLine={true}
          hideTicks={true}
          numTicks={6}
          tickFormat={timeFormatter}
          tickClassName="time-tick"
          pointerEvents="none"
        />
        <AxisBottom
          scale={timeScale}
          top={30}
          hideAxisLine={true}
          numTicks={6}
          tickLength={height - 60}
          strokeWidth={0.1}
          tickStroke="#ddd"
          tickFormat={timeFormatter}
          tickClassName="time-tick"
          pointerEvents="none"
        />
        <AxisRight
          scale={pricePercentScale}
          hideAxisLine={true}
          hideZero={isMultipleCharts ? false : true}
          numTicks={4}
          tickFormat={
            isMultipleCharts ? percentTickFormatter : priceTickFormatter
          }
          tickLength={width - 50}
          strokeWidth={0.2}
          tickStroke="#888"
          tickClassName="price-tick"
          pointerEvents="none"
          tickComponent={(value) => {
            return (
              <svg>
                <text x={value.x} y={value.y} textAnchor={value.textAnchor}>
                  <tspan
                    x={value.x}
                    dx={isMultipleCharts ? "-2em" : "-2.75em"}
                    dy={"-0.25em"}
                  >
                    {selectedCharts.length > 1
                      ? `${value.formattedValue}%`
                      : value.formattedValue}
                  </tspan>
                </text>
              </svg>
            );
          }}
        />
        {/* zero tick */}
        {isMultipleCharts && (
          <Line
            className="zero"
            from={{ x: 0, y: pricePercentScale(0) }}
            to={{ x: width - 50, y: pricePercentScale(0) }}
            x="0"
            y={pricePercentScale(0)}
            strokeWidth={1.25}
            pointerEvents="none"
          />
        )}
        {/* trendlines */}
        {selectedCharts.map((chart) => (
          <Group key={chart} pointerEvents="none">
            <MarkerCircle
              id={`marker-circle-${chart}`}
              size={2}
              refX={2}
              strokeWidth={0.25}
              stroke="#fff"
            />
            <LinePath
              className={`${chart} market-line`}
              data={data.get(chart)}
              x={(d) => timeScale(timeAccessor(d))}
              y={(d) =>
                isMultipleCharts
                  ? pricePercentScale(percentChangeAccessor(d))
                  : pricePercentScale(priceAccessor(d))
              }
              strokeWidth={1.5}
              markerEnd={`url(#marker-circle-${chart})`}
            />
          </Group>
        ))}
        {/* chart hover interaction result */}
        {tooltipData && (
          <VizAnnotation tooltipData={tooltipData} height={height} />
        )}
      </svg>
      <Stocks
        stockData={selectedCharts.map(
          (chart) => data.get(chart)[data.get(chart).length - 1],
        )}
        tooltipData={tooltipData}
      />
    </>
  );
};
