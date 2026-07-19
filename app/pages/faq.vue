<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="mb-8 text-center text-3xl font-bold">
      常见问题 FAQ
    </h1>

    <Accordion type="single" collapsible class="mx-auto w-full max-w-3xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>账号注册后还可以更改真实姓名吗</AccordionTrigger>
        <AccordionContent> 不可以。注册后仅可以更改昵称。 </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>我输入了正确的学号和密码，但不能登录</AccordionTrigger>
        <AccordionContent>
          你可能被管理员禁止登录，如果账号误封请联系管理员进行解封。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger><strong>我的密码会被其他人知道吗</strong></AccordionTrigger>
        <AccordionContent>
          不会。密码存储时使用了Hash加密，无法被直接查看，因此我们也无法告诉你忘记的密码。<br>
          但是网站在登录时传输密码时仅有可能使用HTTPS加密，若你使用HTTP登录，密码将被明文传输，存在安全风险。<br>
          请在安全的网络环境下登录，避免密码被截获。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger><strong>提交歌曲步骤</strong></AccordionTrigger>
        <AccordionContent>
          登录后，在首页点击"投稿"按钮即可进入歌曲提交页面。<br>
          投稿前请先阅读投稿规则与本常见问题，检查是否已有相同歌曲，并尽量选择网易云音乐音源。<br>
          <ul class="list-disc space-y-2 pl-5">
            <li>在搜索框输入你想投稿的歌曲名或歌手名</li>
            <li>在上方选择框选择音源（推荐网易云音乐，BiliBili 其次，QQ 音乐最后选择），点击搜索按钮</li>
            <li>在列表中选择你想投稿的歌曲，可点击播放按钮试听</li>
            <li>选择投稿时显示的名称：实名、匿名或昵称</li>
            <li>可选择期望播放日期；不选择时由系统自由分配</li>
            <li>可选填写私密留言或公开留言，确认无误后提交</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger>提交歌曲时无法使用昵称投稿</AccordionTrigger>
        <AccordionContent> 你还没有设置昵称，请前往个人资料页面设置昵称。 </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger>为什么我投稿的歌曲有些不能删除</AccordionTrigger>
        <AccordionContent>
          不能删除的原因是歌曲已经进入排歌列表或已被使用，无法删除，你只能删除自己投稿的未被排歌的歌曲。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-7">
        <AccordionTrigger>忘记密码怎么办？</AccordionTrigger>
        <AccordionContent> 目前没有开发忘记密码的功能，请联系管理员重置密码。 </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-8">
        <AccordionTrigger>如何联系管理员？</AccordionTrigger>
        <AccordionContent>
          您可以通过以下方式联系管理员：
          <ul class="mt-2 list-disc space-y-2 pl-5">
            <li>发送邮件至管理员邮箱</li>
            <li>联系广播站管理人员</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-9">
        <AccordionTrigger>每周最多可以提交几次歌曲？</AccordionTrigger>
        <AccordionContent>
          用户默认每周最大提交次数为三次。系统会在每周或距离你上次投稿满 5 天后重置次数。<br>
          提交前请确保当前处于开放投稿时间段内，并保证本周仍有剩余次数。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-10">
        <AccordionTrigger>投稿时名称显示方式有什么区别？我的隐私如何保护？</AccordionTrigger>
        <AccordionContent>
          投稿时可以选择以下三种显示方式：
          <ul class="mt-2 list-disc space-y-2 pl-5">
            <li><strong>实名</strong>：对他人显示你的真实姓名</li>
            <li><strong>匿名</strong>：对他人不显示任何投稿人名称</li>
            <li><strong>昵称</strong>：对他人显示你设置的昵称</li>
          </ul>
          <p class="mt-2">
            系统仅将学号、真实姓名、昵称等个人信息用于身份认证与服务提供，不会主动向第三方共享可识别你身份的信息。更多详情请阅读
            <NuxtLink to="/agreement" class="text-blue-600 hover:underline">
              用户协议和隐私政策
            </NuxtLink>。
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-11">
        <AccordionTrigger>留言的可见范围是什么？</AccordionTrigger>
        <AccordionContent>
          <ul class="list-disc space-y-2 pl-5">
            <li><strong>私密留言</strong>：仅审核员在审核和排歌时可见</li>
            <li><strong>公开留言</strong>：会在主页面展示，所有用户可见</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-12">
        <AccordionTrigger>什么是期望播放日期？</AccordionTrigger>
        <AccordionContent />
      </AccordionItem>

      <AccordionItem value="item-13">
        <AccordionTrigger><strong>歌曲排歌规则是怎样的？</strong></AccordionTrigger>
        <AccordionContent>
          首先解释一个概念：期望播放日期。<br>
          期望播放日期是可选填写的日期（格式 YYYY-MM-DD）。<br>
          选择后，排歌系统会优先将该歌曲安排在这一天播放；不填写时，歌曲进入自由分配状态，由系统根据排歌规则自动安排。<br>
          若所选日期已满或不可用，系统会尝试调整到最近的可用日期。<br>
          <ul class="list-disc space-y-2 pl-5">
            <li><strong>优先级</strong>：期望日期优先；未填写期望日期的歌曲按投稿时间先后（早投稿优先）进行自由分配，若在投稿时有期望日期且没有冲突，系统会在审核通过后直接安排到该日期。</li>
            <li><strong>每日时长限制</strong>：每天播放总时长不超过 45 分钟</li>
            <li><strong>期望日期冲突</strong>：若期望日期已满或不可用，系统会尝试调整到最近的可用日期</li>
            <li><strong>无法安排</strong>：若区间内无法容纳，歌曲可能会被标记为未排上，等待管理员处理</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-14">
        <AccordionTrigger>我的投稿会有哪些状态？</AccordionTrigger>
        <AccordionContent>
          <ul class="list-disc space-y-2 pl-5">
            <li><strong>待审核</strong>：已提交，等待审核员审核</li>
            <li><strong>已通过</strong>：审核通过，等待排歌</li>
            <li><strong>已排歌</strong>：已安排到具体播放日期</li>
            <li><strong>已拒绝</strong>：审核未通过，可查看拒绝理由</li>
            <li><strong>未排上</strong>：在排歌区间内无法安排，但是可以在后续排歌时安排。</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <div class="mt-8 text-center">
      <Button as-child>
        <NuxtLink to="/">
          返回首页
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "常见问题",
  description: "常见问题解答",
});

useHead({
  title: "常见问题",
});
</script>
