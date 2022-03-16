import React, { useRef, useState, useEffect } from "react";

import "./inputSlider.css";

interface InputSliderProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "onChange"> {
  value: number;
  values: number[];
  label: string;
  unit: string;
  onChange: (n: number) => void;
}

/**
 * Maps value percentile distance to max, starting from min
 * @param min
 * @param max
 * @param value
 */
const mapRangePercentage = (
  min: number,
  max: number,
  value: number
): number => {
  if (min >= max) return 0;
  return ((value - min) / (max - min)) * 100;
};

/**
 * Maps value's percentile distance to max starting from min, scaled by an outer range
 * @param min
 * @param max
 * @param outMin
 * @param outMax
 * @param value
 */
const mapInOutRangePercentage = (
  min: number,
  max: number,
  outMin: number,
  outMax: number,
  value: number
): number => {
  if (max <= min) return outMin;
  // https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range
  return ((value - min) / (max - min)) * (outMax - outMin) + outMin;
};
/**
 * returns the biggest distance from all element indices in array to number goal
 * @param array
 * @param goal
 */
const snap = (array: number[], goal: number): number => {
  array = [...array.keys()];
  return array.reduce(function (prev, curr) {
    return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
  });
};

const InputSlider = ({
  value,
  onChange,
  label,
  unit,
  values,
  ...restProps
}: InputSliderProps): JSX.Element => {
  const TRACKREF_LEFT_OFFSET = 14;
  const TRACKREF_WIDTH_LESS = 28;

  /* HTML references to later modify width */
  const knobRef = useRef<HTMLDivElement>(null);
  const boundRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const min = 0;
  const max = values.length - 1;

  const [width, setWidth] = useState(272);
  const [left, setLeft] = useState(0);
  const [knobX, setKnobX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleLabelClick = (finalValue: number) => {
    const snapX = mapInOutRangePercentage(min, max, 0, width, finalValue);
    const fillWidth = mapRangePercentage(0, width, snapX);

    if (!knobRef.current || !fillRef.current) return;
    knobRef.current.style.transform = `translateX(${snapX}px)`;
    fillRef.current.style.width = `${fillWidth}%`;
    setSelectedIndex(finalValue);
    onChange(values[finalValue]);
  };

  const handleInputSlider = (updateKnobDirectly: boolean) => {
    const xPercent = mapRangePercentage(0, width, knobX);
    const relativeValue = mapInOutRangePercentage(0, width, min, max, knobX);
    const finalValue = snap(values, relativeValue);
    const snapX = mapInOutRangePercentage(min, max, 0, width, finalValue);
    const fillWidth = mapRangePercentage(0, width, snapX);

    if (updateKnobDirectly) {
      if (!knobRef.current || !fillRef.current) return;
      knobRef.current.style.transform = `translateX(${snapX}px)`;
      fillRef.current.style.width = `${fillWidth}%`;
    } else {
      if (!fillRef.current) return;
      fillRef.current.style.width = xPercent + "%";

      setSelectedIndex(finalValue);
    }
  };

  useEffect(() => {
    if (!trackRef.current) return;
    setLeft(trackRef.current?.getBoundingClientRect().x + TRACKREF_LEFT_OFFSET);
    setWidth(
      trackRef.current?.getBoundingClientRect().width - TRACKREF_WIDTH_LESS
    );

    handleLabelClick(values.indexOf(value));
  }, [value, values]);

  return (
    <div className="slider-field">
      <span className="text-label">{label}</span>
      <div className="slider-inputslider">
        <input type="text" name="input" {...restProps} readOnly />
        <div className="slider-values">
          {values.map((v, i) => (
            <span
              key={v}
              className={i === selectedIndex ? "selected" : ""}
              style={{ left: `${mapRangePercentage(min, max, i)}%` }}
              onClick={() => {
                handleLabelClick(i);
              }}
            >
              {`${v}${unit}`}
            </span>
          ))}
        </div>

        <div
          className="slider-area"
          ref={boundRef}
          onMouseMove={(e) => {
            if (!dragging) return;

            let move = e.pageX - left;

            move = Math.max(0, move);
            move = Math.min(move, width);

            setKnobX(move);

            if (!knobRef.current) return;
            knobRef.current.style.transform = `translateX(${move}px)`;
            handleInputSlider(false);
          }}
          onMouseLeave={(e) => {
            if (!knobRef.current) return;
            knobRef.current.style.cursor = "grab";
            if (dragging) {
              handleInputSlider(true);
              onChange(values[selectedIndex]);
            }

            setDragging(false);
          }}
        >
          <div className="slider-track" ref={trackRef} />
          <div className="slider-fill" ref={fillRef} />
          <div
            ref={knobRef}
            className="slider-knob "
            style={{ cursor: "grab" }}
            onMouseDown={(e) => {
              setDragging(true);
              if (!knobRef.current) return;
              knobRef.current.style.cursor = "grabbing";
            }}
            onMouseUp={(e) => {
              setDragging(false);
              if (!knobRef.current) return;
              knobRef.current.style.cursor = "grab";
              handleInputSlider(true);
              onChange(values[selectedIndex]);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InputSlider;
