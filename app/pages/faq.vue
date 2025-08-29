<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8 text-center">常见问题 FAQ</h1>
    
    <Accordion type="single" collapsible class="w-full max-w-3xl mx-auto">
      <AccordionItem value="item-1">
        <AccordionTrigger>账号注册后还可以更改真实姓名吗</AccordionTrigger>
        <AccordionContent>
          不可以。注册后仅可以更改昵称
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2">
        <AccordionTrigger>我输入了正确的学号和密码，但不能登录</AccordionTrigger>
        <AccordionContent>
          你可能被管理员禁止登录，如果账号误封请联系管理员进行解封。
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-3">
        <AccordionTrigger>如何提交歌曲？</AccordionTrigger>
        <AccordionContent>
          登录后，在首页点击"投稿"按钮即可进入歌曲提交页面。每个用户每周有一定次数的提交限制。
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-4">
        <AccordionTrigger>提交歌曲步骤</AccordionTrigger>
        <AccordionContent>
          <ul class="list-disc pl-5 space-y-2">
            <li>首先在输入框输入你想投稿的歌曲名或歌手名</li>
            <li>然后在上方选择框选择音源（尽量选择网易云），点击搜索按钮</li>
            <li>在列表中选择你想投稿的歌曲，可试听</li>
            <li>选择投稿方式（对其他人显示的名称，匿名不显示）</li>
            <li>可选留言，私密留言仅审核员审核和排歌时可见，公开留言仅在主页面可见</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-5">
        <AccordionTrigger>提交歌曲时无法使用昵称投稿</AccordionTrigger>
        <AccordionContent>
          你还没有设置昵称，请前往个人资料页面设置昵称
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-6">
        <AccordionTrigger>为什么我投稿的歌曲有些不能删除</AccordionTrigger>
        <AccordionContent>
          不能删除的原因是歌曲已经进入排歌列表，无法删除，你只能删除自己投稿的未被排歌的歌曲。
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-7">
        <AccordionTrigger>忘记密码怎么办？</AccordionTrigger>
        <AccordionContent>
          目前没有开发忘记密码的功能，请联系管理员重置密码。
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-8">
        <AccordionTrigger>如何联系管理员？</AccordionTrigger>
        <AccordionContent>
          您可以通过以下方式联系管理员：
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>发送邮件至管理员邮箱</li>
            <li>联系广播站管理人员</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <div class="text-center mt-8">
      <Button asChild>
        <NuxtLink to="/">返回首页</NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '常见问题',
  description: '常见问题解答'
})
</script>