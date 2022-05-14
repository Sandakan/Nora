/* eslint-disable react/require-default-props */
interface ErrorPromptProps {
  isFatal?: boolean;
}

export default ({ isFatal }: ErrorPromptProps) => {
  return (
    <>
      <div className="alert-icon-container">
        <span className="material-icons-round icon">warning</span>
      </div>
      <div>
        An {isFatal ? 'fatal' : ''} error occurred. Lorem ipsum dolor sit amet,
        consectetur adipisicing elit. Neque fugiat doloremque est, fugit veniam
        ipsa sed earum possimus eum, dolor officiis blanditiis, saepe pariatur
        reiciendis quia voluptates dignissimos placeat at? Lorem ipsum, dolor
        sit amet consectetur adipisicing elit. Qui excepturi aspernatur tempora
        vero, nemo error omnis expedita ipsa eos cumque quibusdam sapiente,
        ratione dolores ut labore officiis nostrum perferendis quis.
      </div>
      <button className="restart-btn" type="button">
        Restart App
      </button>
    </>
  );
};
