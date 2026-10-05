"use client";

import React, { ReactNode, createRef } from "react";
import Draggable from "react-draggable";

interface DraggableWrapperProps {
  children: ReactNode;
  handle?: string;
}

class DraggableWrapper extends React.Component<DraggableWrapperProps> {
  nodeRef = createRef<HTMLDivElement>();

  render() {
    const { children, handle } = this.props;

    return (
      <Draggable handle={handle} nodeRef={this.nodeRef}>
        <div ref={this.nodeRef}>{children}</div>
      </Draggable>
    );
  }
}

export default DraggableWrapper;
