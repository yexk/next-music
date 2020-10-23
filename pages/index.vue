<template>
  <div class="container">
    <button @click="test">test</button>
    <ul>
      <li v-for="item in commeHostList" :key="item.id">
        <div>
          <div>{{ item.simpleResourceInfo.name }} <img width="50" height="50"
                                                       :src="item.simpleResourceInfo.songCoverUrl"
                                                       alt="avatar"></div>
          <div>
            <span>{{ item.content }}</span> by <span>
        {{ item.simpleUserInfo.nickname }} <img width="50" height="50" :src="item.simpleUserInfo.avatar" alt="avatar">
      </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>

export default {
  data() {
    return {
      commeHostList: [],
      envId: '',
      isLoginSuccss: false
    };
  },
  async mounted() {
    this.envId = this.$cloudbase.config.env;
    // 以匿名登录为例
    try {
      const auth = this.$cloudbase.auth({persistence: "local"});

      if (!auth.hasLoginState()) {
        await auth.anonymousAuthProvider().signIn();
      }

      console.log("用户id", auth.hasLoginState().user.uid);

      this.isLoginSuccss = true;
    } catch (e) {
      this.isLoginSuccss = false;
      console.error(e);
      console.log(e.code);
    }
  },
  methods: {
    async test() {
      console.log(this.$cloudbase);
      let response = await this.$cloudbase.callFunction({
        name: "music-api",
        data: {
          action: 'comment_hotwall_list'
        },
      });
      response = response.result;

      if (response.code === 200) {
        this.commeHostList = response.data;
      }
    }
  },
};
</script>

<style>
</style>
