import * as React from "react";
import {
  Worker,
  Viewer,
  Button,
  Position,
  PrimaryButton,
  Tooltip,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import { highlightPlugin, MessageIcon } from "@react-pdf-viewer/highlight";
import { useNavigate } from "react-router-dom";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";

import logo from "./logo.svg";

function App() {
  const navigate = useNavigate();

  console.log(window.location);
  const searchParams = window.location.search
    .replace("?", "")
    .split("&")
    .map((param) => param.split("="))
    .reduce((values, [key, value]) => {
      values[key] = value;
      return values;
    }, {});

  console.log(searchParams.file);
  const fileName = searchParams.file;
  const bookName = searchParams.book;
  const authorName = searchParams.author;

  const newBook = "http://192.168.1.143:5000/uploads/books/" + fileName;
  const bookmarkPluginInstance = bookmarkPlugin();
  const [message, setMessage] = React.useState("");
  const [notes, setNotes] = React.useState([]);
  const notesContainerRef = React.useRef(null);
  let noteId = notes.length;
  const noteEles = new Map();

  const transform = (slot) => ({
    ...slot,
    Download: () => <></>,
    DownloadMenuItem: () => <></>,
    Print: () => <></>,
    PrintMenuItem: () => <></>,
    Open: () => <></>,
    OpenMenuItem: () => <></>,
  });

  const renderHighlightTarget = (props) => (
    <div
      style={{
        background: "#eee",
        display: "flex",
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: "translate(0, 8px)",
        zIndex: 1,
      }}
    >
      <Tooltip
        position={Position.TopCenter}
        target={
          <Button onClick={props.toggle}>
            <MessageIcon />
          </Button>
        }
        content={() => <div style={{ width: "100px" }}>Add a note</div>}
        offset={{ left: 0, top: -8 }}
      />
    </div>
  );

  const renderHighlightContent = (props) => {
    const addNote = () => {
      if (message !== "") {
        const note = {
          id: ++noteId,
          content: message,
          highlightAreas: props.highlightAreas,
          quote: props.selectedText,
        };
        setNotes(notes.concat([note]));
        props.cancel();
      }
    };

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0, 0, 0, .3)",
          borderRadius: "2px",
          padding: "8px",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1,
        }}
      >
        <div>
          <textarea
            rows={3}
            style={{
              border: "1px solid rgba(0, 0, 0, .3)",
            }}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "8px",
          }}
        >
          <div style={{ marginRight: "8px" }}>
            <PrimaryButton onClick={addNote}>Add</PrimaryButton>
          </div>
          <Button onClick={props.cancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  const jumpToNote = (note) => {
    const notesContainer = notesContainerRef.current;
    if (noteEles.has(note.id) && notesContainer) {
      notesContainer.scrollTop = noteEles
        .get(note.id)
        .getBoundingClientRect().top;
    }
  };

  const renderHighlights = (props) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => (
              <div
                key={idx}
                style={Object.assign(
                  {},
                  {
                    background: "yellow",
                    opacity: 0.4,
                  },
                  props.getCssProperties(area, props.rotation)
                )}
                onClick={() => jumpToNote(note)}
              />
            ))}
        </React.Fragment>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  React.useEffect(() => {
    return () => {
      noteEles.clear();
    };
  }, []);

  const sidebarNotes = (
    <div
      ref={notesContainerRef}
      style={{
        overflow: "auto",
        width: "100%",
      }}
    >
      {notes.length === 0 && (
        <div style={{ textAlign: "center" }}>There is no note</div>
      )}
      {notes.map((note) => {
        return (
          <div
            key={note.id}
            style={{
              borderBottom: "1px solid rgba(0, 0, 0, .3)",
              cursor: "pointer",
              padding: "8px",
            }}
            onClick={() => jumpToHighlightArea(note.highlightAreas[0])}
            ref={(ref) => {
              noteEles.set(note.id, ref);
            }}
          >
            <blockquote
              style={{
                borderLeft: "2px solid rgba(0, 0, 0, 0.2)",
                fontSize: ".75rem",
                lineHeight: 1.5,
                margin: "0 0 8px 0",
                paddingLeft: "8px",
                textAlign: "justify",
              }}
            >
              {note.quote}
            </blockquote>
            {note.content}
          </div>
        );
      })}
    </div>
  );

  const renderToolbar = (Toolbar) => (
    <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: (defaultTabs) =>
      defaultTabs.concat({
        content: sidebarNotes,
        icon: <MessageIcon />,
        title: "Notes",
      }),
  });
  const { renderDefaultToolbar } =
    defaultLayoutPluginInstance.toolbarPluginInstance;

  return (
    <div className="main">
      <nav className="nav shadow-sm mb-2">
        <div className="d-flex flex-row container flex-wrap">
          <a className="nav-link my-2" href="http://192.168.1.143:3002/">
            <img src={logo} alt="Logo DMC" className="logo" />
          </a>
          <div className="nav-link my-2">
            <a className="home-button" href="http://192.168.1.143:3002/">
              {" "}
              Home
            </a>

            <span className="book-name" onClick={() => navigate(-1)}>
              {"  / " + bookName}{" "}
            </span>
          </div>
        </div>
      </nav>
      <div className="container">
        {/* View PDF */}
        <div className="viewer">
          {
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js">
              <Viewer
                fileUrl={newBook}
                plugins={[
                  defaultLayoutPluginInstance,
                  bookmarkPluginInstance,
                  highlightPluginInstance,
                ]}
              ></Viewer>
            </Worker>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
