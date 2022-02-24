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

const mapRangePercentage = (
  min: number,
  max: number,
  value: number
): number => {
  return ((value - min) / (max - min)) * 100;
};

const mapInOutRangePercentage = (
  min: number,
  max: number,
  outMin: number,
  outMax: number,
  value: number
): number => {
  // https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range
  return ((value - min) / (max - min)) * (outMax - outMin) + outMin;
};

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

  const handleLabelClick = (finalValue) => {
    const snapX = mapInOutRangePercentage(min, max, 0, width, finalValue);
    const fillWidth = mapRangePercentage(0, width, snapX);

    knobRef.current.style.transform = `translateX(${snapX}px)`;
    fillRef.current.style.width = `${fillWidth}%`;
    setSelectedIndex(finalValue);
    onChange(values[finalValue]);
  };

  const handleInputSlider = (flag) => {
    const xPercent = mapRangePercentage(0, width, knobX);
    const relativeValue = mapInOutRangePercentage(0, width, min, max, knobX);
    const finalValue = snap(values, relativeValue);
    const snapX = mapInOutRangePercentage(min, max, 0, width, finalValue);
    const fillWidth = mapRangePercentage(0, width, snapX);

    if (flag) {
      knobRef.current.style.transform = `translateX(${snapX}px)`;
      fillRef.current.style.width = `${fillWidth}%`;
    } else {
      fillRef.current.style.width = xPercent + "%";

      setSelectedIndex(finalValue);
    }
  };

  //TODO: bei einem Window Resize geht da alles schief.
  useEffect(() => {
    //setSelectedIndex(values.indexOf(value));
    setLeft(trackRef.current?.getBoundingClientRect().x + 14);
    setWidth(trackRef.current?.getBoundingClientRect().width - 28);

    handleLabelClick(values.indexOf(value));
  }, []);

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
            knobRef.current.style.transform = `translateX(${move}px)`;
            handleInputSlider(false);
          }}
          onMouseLeave={(e) => {
            knobRef.current.style.cursor = "grab";
            if (dragging) {
              handleInputSlider(true);
              onChange(values[selectedIndex]);
            }

            setDragging(false);
          }}
        >
          <div className="slider-track" ref={trackRef}></div>
          <div className="slider-fill" ref={fillRef}></div>
          <div
            ref={knobRef}
            className="slider-knob "
            style={{ cursor: "grab" }}
            onMouseDown={(e) => {
              setDragging(true);
              knobRef.current.style.cursor = "grabbing";
            }}
            onMouseUp={(e) => {
              setDragging(false);
              knobRef.current.style.cursor = "grab";
              handleInputSlider(true);
              onChange(values[selectedIndex]);
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default InputSlider;
