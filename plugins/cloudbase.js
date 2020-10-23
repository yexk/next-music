import Vue from "vue";
import Cloudbase from "@cloudbase/vue-provider";

export default async (context) => {
  const envId = await fetch(`${context.env.backend}/backend`)
    .then(response => response.json())
    .then(data => data.envId);

  Vue.use(Cloudbase, {
    env: envId
  });
};
