import React, { Component } from "react";
import "./UploadVideo.css";
import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
const bip39 = require("bip39");
const BigchainDB = require("bigchaindb-driver");
import { applicationID, applicationKey } from "../../keys/bigchaindbKey";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Select,
  MenuItem
} from "@material-ui/core";
const uuidv1 = require("uuid/v1");
const IPFS = require("ipfs");
const node = new IPFS();
var Buffer = require("buffer/").Buffer;

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  media: {
    // ⚠️ object-fit is not supported by IE11.
    // objectFit: "cover",
  },
  formControl: {
    margin: theme.spacing.unit
  },
  card: {
    marginLeft: "auto",
    marginRight: "auto"
  },
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200
  },
  dense: {
    marginTop: 19
  },
  menu: {
    width: 200
  }
});

class UploadVideo extends Component {
  constructor(props) {
    super(props);
    // const { classes } = props;
    this.state = {
      title: "",
      description: "",
      author: "",
      dateAdded: "",
      fileLoadComplete: false,
      file: null,
      fileName: "Select File",
      filePreview: "",
      ipfsHash: null,
      fileSize: 0,
      category: null,
      percentUploaded: 0,
      uploading: false
    };

    this.onVideoFileChange = this.onVideoFileChange.bind(this);
    this.onVideoTitleChange = this.onVideoTitleChange.bind(this);
    this.onVideoDescriptionChange = this.onVideoDescriptionChange.bind(this);
    this.onSubmitVideo = this.onSubmitVideo.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);

    node.on("ready", () => {
      console.log("Node is now ready");
    });

    this.reader = null;
  }

  onVideoTitleChange = event => {
    this.setState({
      title: event.target.values
    });
  };

  onVideoDescriptionChange = event => {
    this.setState({
      description: event.target.value
    });
  };

  onFileLoad = () => {
    this.setState({ file: Buffer.from(this.reader.result) });
    this.setState({ fileLoadComplete: true });
  };

  onVideoFileChange = event => {
    // Setting up File Reader and saving input file as Array Buffer
    this.reader = new FileReader();
    this.reader.onload = this.onFileLoad;
    this.reader.readAsArrayBuffer(event.target.files[0]);
    this.setState({ fileSize: event.target.files[0].size });
    this.setState({ fileName: event.target.files[0].name });
    const { classes } = this.props;

    this.setState({
      filePreview: (
        <CardMedia
          component="video"
          controls
          style={{ height: "560px", background: "#000000" }}
          className={classes.media}
          src={URL.createObjectURL(event.target.files[0])}
          title={event.target.files[0].name}
        />
      )
    });
  };

  onCategoryChange = event => {
    this.setState({
      category: event.target.value
    });
  };

  setProgressBar = chunks => {
    // console.log(chunks);
    this.setState({
      percentUploaded: Math.floor((chunks / this.state.fileSize) * 100)
    });
  };

  onSubmitVideo = event => {
    if (this.state.file != null) {
      this.setState({ uploading: true });
      // Check if the video title and video description is empty
      console.log("Starting upload of " + this.state.fileName);
      const dataObject = this.state.file;
      console.log("started upload");
      //add code to show progress

      node.files.add(
        dataObject,
        { progress: this.setProgressBar },
        (error, files) => {
          if (error) {
            console.error(error);
          } else {
            console.log(files[0].hash);
            const videoHashes = {
              "720p": files[0].hash
            };

            // add hashes to db
            const uuid = uuidv1();
            const asset = {
              videoHashes,
              author: this.state.author,
              title: this.state.title,
              uuid: uuid,
              category: this.state.category,
              description: this.state.description,
              submissionTime: new Date().toDateString()
            };

            this.addVideoToDB(asset);
          }
        }
      );
    }
  };
  addVideoToDB = assets => {
    const API_PATH = "https://test.bigchaindb.com/api/v1/";
    const conn = new BigchainDB.Connection(API_PATH, {
      app_id: "9b81ac62",
      app_key: "3018c3958254035206e6d4c147649afa"
    });
    const seed = bip39.mnemonicToSeed("ProjectINK").slice(0, 32);
    const alice = new BigchainDB.Ed25519Keypair(seed);

    const txCreateVideo = BigchainDB.Transaction.makeCreateTransaction(
      {
        assets
      },
      {},
      [
        BigchainDB.Transaction.makeOutput(
          BigchainDB.Transaction.makeEd25519Condition(alice.publicKey)
        )
      ],
      alice.publicKey
    );
    const txSigned = BigchainDB.Transaction.signTransaction(
      txCreateVideo,
      alice.privateKey
    );
    conn.postTransactionCommit(txSigned).then(res => console.log(res));
  };

  render() {
    const { classes } = this.props;
    const categories = ["Music", "Gaming", "Trailer", "Vlogs", "Advertisement"];
    return (
      <div className="container-fluid" style={{ padding: "5%" }}>
        <Card className={classes.card} style={{ width: "70%" }}>
          <CardContent>
            <form>
              <fieldset>
                <div className="form-group">
                  <input
                    className="form-control"
                    placeholder="Title"
                    type="text"
                  />
                </div>
                <div className="form-group">
                  <input
                    className="form-control"
                    placeholder="Description"
                    type="text"
                  />
                </div>

                <Select
                  style={{ minWidth: 120, width: "auto" }}
                  value={this.state.category}
                  onChange={this.onCategoryChange}
                >
                  <MenuItem>
                    <em value={""}>None</em>
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </fieldset>
            </form>
          </CardContent>
          {this.state.filePreview}
          <CardActions>
            <label
              className={
                !this.state.uploading
                  ? "btn btn-primary"
                  : "btn btn-primary disabled"
              }
              htmlFor="video_file_input"
            >
              {this.state.fileName}
            </label>
            <input
              disabled={this.state.uploading}
              onChange={this.onVideoFileChange}
              style={{ display: "none" }}
              type="file"
              accept="video"
              id="video_file_input"
            />
            <div
              style={
                this.state.fileSize > 0
                  ? { display: "block" }
                  : { display: "none" }
              }
            >
              <button
                disabled={this.state.uploading}
                onClick={() => {
                  this.onSubmitVideo();
                }}
                className="btn btn-primary"
                role="button"
              >
                {this.state.fileLoadComplete ? (
                  "Upload"
                ) : (
                  <CircularProgress size={20} />
                )}
              </button>
            </div>
          </CardActions>

          <div
            style={
              this.state.percentUploaded != 0
                ? { display: "block" }
                : { display: "none" }
            }
          >
            <center>
              <Chip
                style={{ marginBottom: "5px" }}
                label={this.state.percentUploaded + "%"}
                color="primary"
              />
            </center>
            <LinearProgress
              variant="determinate"
              value={this.state.percentUploaded}
            />
          </div>
        </Card>
      </div>
    );
  }
}

export default withStyles(styles)(UploadVideo);
