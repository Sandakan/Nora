import Hyperlink from 'renderer/components/Hyperlink';

const MusixmatchDisclaimerPrompt = () => {
  return (
    <div className="">
      <div className="mb-4 flex items-center text-3xl font-semibold uppercase">
        <span className="material-icons-round-outlined mr-2 text-4xl !leading-none">
          error
        </span>{' '}
        <p>Disclaimer - Musixmatch Lyrics</p>
      </div>
      <div className="description px-4">
        <ul className="list-disc">
          <li>
            Musixmatch Lyrics is added as an evaluation feature to this software
            and could be removed at any time.
          </li>
          <li>
            Nora is in no way affiliated with, authorised, maintained, sponsored
            or endorsed by Musixmatch Lyrics or any of its affiliates or
            subsidiaries.
          </li>
          <li>
            The maintainers of this application call upon the personal
            responsibility of its users to use this feature in a fair way, as it
            is intended to be used by obeying the copyrights implemented by
            Musixmatch Lyrics.
          </li>
        </ul>
        <br />
        <p>
          Implementation from Fashni's
          <Hyperlink
            label="MxLRC"
            link="https://github.com/fashni/MxLRC"
            linkTitle="MxLRC Github Repository"
            className="ml-1"
          />
          .
        </p>
        <br />
        <p>
          If you have any complaints,{' '}
          <Hyperlink
            label="Contact me through my email."
            link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora"
            linkTitle="Email"
            noValidityCheck
          />
          .
        </p>
      </div>
    </div>
  );
};

export default MusixmatchDisclaimerPrompt;
