import { DiscussionEmbed } from "disqus-react";
import { environment } from "lib/constants";

const DisqusComments = ({ post }) => {
  const disqusShortname = "zeitgeist-pm";

  const disqusConfig = {
    url:
      environment === "staging"
        ? "http://staging.zeitgeist.pm" + post.marketId
        : "http://app.zeitgeist.pm" + post.marketId,
    identifier: post.marketId, // Single post id
    title: post.question, // Single post title
  };

  return (
    <div>
      <DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
    </div>
  );
};

export default DisqusComments;
