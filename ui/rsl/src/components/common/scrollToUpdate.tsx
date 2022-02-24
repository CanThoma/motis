import React, { useRef, useState, useEffect } from "react";

import Loading from "./Loading";

import "./scrollToUpdate.css";

interface ScrollToUpdateProps {
  onRefreshUP: () => void;
  onRefreshDOWN: () => void;
  children: JSX.Element;
}

const ScrollToUpdate: React.FC<ScrollToUpdateProps> = ({
  onRefreshUP,
  onRefreshDOWN,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  const scrollDownRef = useRef<HTMLDivElement>(null);
  const scrollUpRef = useRef<HTMLDivElement>(null);

  // TODO: !!! Da musst du dir nochemol gedankenmachen, ob die die Loading Variable nach hier weitergeben willst.
  const [loading, setLoading] = useState(false);
  const [scrollDownOppacity, setScrollDownOppacity] = useState(0);
  const [scrollUpOppacity, setScrollUpOppacity] = useState(0);

  let load = false;
  let topReached = true;
  let bottomReached = true;
  const maxPullDownDistance = 95;
  const resistance = 0.8;
  const scrollSpeed = 5;
  let startY = 0;
  let abort = false;
  let currentY = 0;
  let timerID: number | null = null;
  let timing = false;

  const timer = () =>
    setTimeout(() => {
      childrenRef.current!.style.transform = `translateY(0px)`;
      setScrollDownOppacity(0);
      setScrollUpOppacity(0);
      currentY = 0;
      timing = false;
    }, 2000);

  useEffect(() => {
    //loading = false;
    topReached = true;
    bottomReached = true;
    setLoading(false);
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

  const loadData = (refreshFunction) => {
    load = true;
    setLoading(true);
    childrenRef.current!.style.transform = `translateY(0px)`;
    currentY = 0;
    setScrollDownOppacity(0);
    setScrollUpOppacity(0);
    refreshFunction();

    console.log("Ahhhhhhhhh!!!! GENAU JETZT LADE ICH NEUE DATEN! ");
  };

  const setTopAndBottomFlags = () => {
    const { current } = containerRef;

    bottomReached =
      current.getBoundingClientRect().bottom - visualViewport.height < 10;

    topReached =
      visualViewport.pageTop - current.getBoundingClientRect().top < 0;

    if (!bottomReached && !topReached) {
      currentY = 0;
      childrenRef.current!.style.transform = `translateY(0px)`;
    }
  };

  const onWheel = (e: WheelEvent) => {
    setTopAndBottomFlags();

    if (load) return;
    if (e.deltaY === 0) return;

    currentY = e.deltaY > 0 ? currentY - scrollSpeed : currentY + scrollSpeed;

    if (e.deltaY > 0) {
      // Scroll Down
      setScrollUpOppacity(0);

      if (!bottomReached) return;

      e.preventDefault();

      const yDistanceMoved = Math.min(
        (startY - currentY) / resistance,
        maxPullDownDistance
      );

      childrenRef.current!.style.transform = `translateY(-${yDistanceMoved}px)`;

      if (!timing) {
        timing = true;
        timerID = timer();
      }

      setScrollDownOppacity(yDistanceMoved / 50);
      setScrollUpOppacity(0);

      if (!load && yDistanceMoved >= maxPullDownDistance) {
        loadData(onRefreshDOWN);

        //onEnd();
        return;
      }
    } else {
      // Scroll UP
      setScrollDownOppacity(0);

      if (!topReached) return;

      e.preventDefault();

      const yDistanceMoved = Math.min(
        (currentY - startY) / resistance,
        maxPullDownDistance
      );

      childrenRef.current!.style.transform = `translateY(${yDistanceMoved}px)`;

      if (!timing) {
        timing = true;
        timerID = timer();
      }

      setScrollUpOppacity(yDistanceMoved / 50);
      setScrollDownOppacity(0);

      if (!load && yDistanceMoved >= maxPullDownDistance) {
        loadData(onRefreshUP);

        //onEnd();
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
        style={{ height: "60px", opacity: scrollUpOppacity }}
      >
        {loading && (
          <div className="reveal active">
            <Loading />
          </div>
        )}
        {!loading && (
          <div className="reveal active">
            <h3 className="arrow" style={{ color: "#cacaca" }}>
              Choo Choo! Auf nach Mexicoo 🚂 🇲🇽
            </h3>
            <div className="arrow arrow-up">
              <span></span>
              <span></span>
              <span></span>
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
        style={{ height: "60px", opacity: scrollDownOppacity }}
      >
        {loading && (
          <div className="reveal active">
            <Loading />
          </div>
        )}
        {!loading && (
          <div className="reveal active">
            <h3 className="arrow" style={{ color: "#cacaca" }}>
              Trau dich und scroll weiter für neue Einträge 😘
            </h3>
            <div className="arrow">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScrollToUpdate;
