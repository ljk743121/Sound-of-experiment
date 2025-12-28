<template>
  <ClientOnly>
    <template #fallback>
      <slot />
    </template>

    <Dialog>
      <DialogTrigger as-child>
        <slot />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> 规则介绍 </DialogTitle>
        </DialogHeader>
        <ScrollArea class="max-h-[60vh] pr-2 sm:h-auto" type="auto">
          <NuxtLink to="/faq">
            <p class="text-blue-500 underline">
              查看常见问题
            </p>
          </NuxtLink>
          <NuxtLink to="https://voszsy.netlify.app/guide/">
            <p class="text-muted-foreground underline">
              查看使用说明
            </p>
          </NuxtLink>
          <div class="prose">
            <ol>
              <li>
                歌曲内容务必积极向上，充满正能量，适合在校园内播放，深圳实验广播站有权对歌曲进行筛选
              </li>
              <li>
                投稿的歌曲要经过后台人员审核并排歌后才会在广播站播放，审核通过但落选的歌曲将会在下次排歌时自动使用
              </li>
              <li>每周或投稿歌曲5天后会重置点歌次数，默认为2次</li>
              <li>广播站使用歌曲软件为QQ音乐,网易云音乐以及哔哩哔哩，只接受这些平台有版权的歌曲</li>
              <li> 哔哩哔哩因技术原因加载的音频实际为视频，响应时间可能较慢，若播放较慢请耐心等待</li>
              <li>
                歌曲尽量为非VIP歌曲，若投稿QQ音乐的VIP歌曲有极小概率可能只能播放歌曲片段，如介意请先确认是否可以播放
              </li>
              <li>根据同学的反馈与学校要求，会对部分歌曲审核不通过或删去</li>
              <li>最终审核解释权由广播站所有</li>
              <li>歌单仅供参考，歌曲播出顺序按实际为准</li>
            </ol>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </ClientOnly>
</template>
