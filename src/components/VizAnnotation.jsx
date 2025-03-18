import { Group } from "@visx/group";
import { Line, Circle } from "@visx/shape";
import "./viz-annotation.css";

export const VizAnnotation = ({ tooltipData, height }) => (
  <Group>
    <Line
      className="hover-line"
      from={{ x: tooltipData[0].x, y: 30 }}
      to={{ x: tooltipData[0].x, y: height - 40 }}
      stroke="#000"
      strokeWidth={1}
      strokeDasharray="5,2"
      pointerEvents="none"
    />
    {tooltipData.map((d) => (
      <Circle
        key={d.ticker}
        cx={d.x}
        cy={d.y}
        r={4}
        strokeWidth="2"
        pointerEvents="none"
        className={`hover-circle ${d.ticker}`}
      />
    ))}
  </Group>
);
