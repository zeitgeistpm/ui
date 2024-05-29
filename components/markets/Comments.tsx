import { DiscussionEmbed } from "disqus-react";
import { environment } from "lib/constants";

const DisqusComments = ({ post }) => {
  const disqusShortname = "thewsx-com";

  const disqusConfig = {
    url:
      environment === "staging"
        ? "http://staging.thewsx.com" + post.marketId
        : "http://app.thewsx.com" + post.marketId,
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
