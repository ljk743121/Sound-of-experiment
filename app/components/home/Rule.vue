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
          <DialogTitle>
            规则介绍
          </DialogTitle>
        </DialogHeader>
        <ScrollArea class="max-h-[60vh] pr-2 sm:h-auto" type="auto">
          <div class="prose">
            <ol>
              <li>歌曲内容务必积极向上，充满正能量，适合在校园内播放，深圳实验广播站有权对歌曲进行筛选</li>
              <li>会控制每天的歌曲风格，使各个风格的歌曲平均分配，因此有部分通过审核的歌曲不会播放，相同曲风的歌曲以投稿时间先后播放</li>
              <li>落选的歌曲将会在下次排歌歌曲不足时使用</li>
              <li>与上周歌单有重复的歌曲不播放</li>
              <li>每周会重置点歌次数，默认为一周2次</li>
              <li>广播站使用歌曲软件为QQ音乐和网易云音乐，只接受QQ音乐和网易云音乐有版权的歌曲</li>
              <li>根据同学的反馈与学校要求，会对部分过于吵的歌曲审核删去</li>
              <li>最终审核解释权由广播站所有</li>
              <li>歌单仅供参考，歌曲播出顺序按实际为准</li>
            </ol>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </ClientOnly>
</template>
