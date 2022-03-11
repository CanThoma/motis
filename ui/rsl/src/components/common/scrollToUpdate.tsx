import React, { useRef, useState, useEffect } from "react";

import Loading from "./Loading";

import "./scrollToUpdate.css";

interface ScrollToUpdateProps {
  onRefreshUP: () => void;
  onRefreshDOWN: () => void;
  children: JSX.Element;
}

// TODO Pfeilrichtung
/**
 *
 * @param onRefreshUP
 * @param onRefreshDOWN
 * @param children
 * @constructor
 */
const ScrollToUpdate: React.FC<ScrollToUpdateProps> = ({
  onRefreshUP,
  onRefreshDOWN,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  const scrollDownRef = useRef<HTMLDivElement>(null);
  const scrollUpRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [scrollDownOpacity, setScrollDownOpacity] = useState(0);
  const [scrollUpOpacity, setScrollUpOpacity] = useState(0);

  let load = false;
  let topReached = true;
  let bottomReached = true;
  const maxPullDownDistance = 95;
  const resistance = 0.8;
  const scrollSpeed = 5;
  const startY = 0;
  let currentY = 0;
  let timerID: number | null = null;
  let timing = false;

  const timer = () =>
    setTimeout(() => {
      if (!childrenRef.current) return;
      childrenRef.current.style.transform = `translateY(0px)`;
      setScrollDownOpacity(0);
      setScrollUpOpacity(0);
      currentY = 0;
      timing = false;
    }, 2000);

  useEffect(() => {
    //loading = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    topReached = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    bottomReached = true;
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load = false;

    if (!childrenRef || !childrenRef.current) return;

    const childrenEl = childrenRef.current;
    childrenEl.addEventListener("wheel", onWheel);
    //childrenEl.addEventListener("scroll", onScroll);

    return () => {
      childrenEl.removeEventListener("wheel", onWheel);
      if (timerID) {
        clearTimeout(timerID);
      }
    };
  }, [children]);

  const loadData = (refreshFunction: () => void) => {
    load = true;
    setLoading(true);
    if (!childrenRef.current) return;
    childrenRef.current.style.transform = `translateY(0px)`;
    currentY = 0;
    setScrollDownOpacity(0);
    setScrollUpOpacity(0);
    refreshFunction();
  };

  const setTopAndBottomFlags = () => {
    const { current } = containerRef;

    if (!current) return;
    bottomReached =
      current.getBoundingClientRect().bottom - visualViewport.height < 10;

    topReached =
      visualViewport.pageTop - current.getBoundingClientRect().top < 0;

    if (!bottomReached && !topReached) {
      currentY = 0;
      if (!childrenRef.current) return;
      childrenRef.current.style.transform = `translateY(0px)`;
    }
  };

  const onWheel = (e: WheelEvent) => {
    setTopAndBottomFlags();

    if (load) return;
    if (e.deltaY === 0) return;

    currentY = e.deltaY > 0 ? currentY - scrollSpeed : currentY + scrollSpeed;

    if (e.deltaY > 0) {
      // Scroll Down
      setScrollUpOpacity(0);

      if (!bottomReached) return;

      e.preventDefault();

      const yDistanceMoved = Math.min(
        (startY - currentY) / resistance,
        maxPullDownDistance
      );

      if (!childrenRef.current) return;
      childrenRef.current.style.transform = `translateY(-${yDistanceMoved}px)`;

      if (!timing) {
        timing = true;
        timerID = timer();
      }

      setScrollDownOpacity(yDistanceMoved / 50);
      setScrollUpOpacity(0);

      if (!load && yDistanceMoved >= maxPullDownDistance) {
        loadData(onRefreshDOWN);

        //onEnd();
        return;
      }
    } else {
      // Scroll UP
      setScrollDownOpacity(0);

      if (!topReached) return;

      e.preventDefault();

      const yDistanceMoved = Math.min(
        (currentY - startY) / resistance,
        maxPullDownDistance
      );

      if (!childrenRef.current) return;
      childrenRef.current.style.transform = `translateY(${yDistanceMoved}px)`;

      if (!timing) {
        timing = true;
        timerID = timer();
      }

      setScrollUpOpacity(yDistanceMoved / 50);
      setScrollDownOpacity(0);

      if (!load && yDistanceMoved >= maxPullDownDistance) {
        loadData(onRefreshUP);

        return;
      }
    }
  };

  return (
    <div
      style={{ height: "calc(100% + 190px)", overflow: "hidden" }}
      className="scroll-update"
      ref={containerRef}
    >
      <section
        ref={scrollUpRef}
        className="scroll-up-container"
        style={{ height: "60px", opacity: scrollUpOpacity }}
      >
        {loading && (
          <div className="reveal active">
            <Loading />
          </div>
        )}
        {!loading && (
          <div className="reveal active">
            <h3 className="arrow" style={{ color: "#cacaca" }}>
              Erneut Scrollen zum Laden weiterer Verbindungen!
            </h3>
            <div className="arrow arrow-up">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </section>
      <section className="scroll-update-children" ref={childrenRef}>
        {children}
      </section>
      <section
        ref={scrollDownRef}
        className="scroll-down-container"
        style={{ height: "60px", opacity: scrollDownOpacity }}
      >
        {loading && (
          <div className="reveal active">
            <Loading />
          </div>
        )}
        {!loading && (
          <div className="reveal active">
            <h3 className="arrow" style={{ color: "#cacaca" }}>
              Erneut Scrollen zum Laden weiterer Verbindungen!
            </h3>
            <div className="arrow ">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScrollToUpdate;
