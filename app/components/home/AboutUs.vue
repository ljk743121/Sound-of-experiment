<template>
  <ClientOnly>
    <template #fallback>
      <slot />
    </template>

    <Dialog>
      <DialogTrigger>
        <slot />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> 关于我们 </DialogTitle>
        </DialogHeader>

        <LogosSoe class="mx-auto w-1/2" />
        <section class="prose">
          <p>
            <span class="mx-1 font-mono font-light tracking-tighter text-blue-700">Voice of SZSY</span>
            是
            <b>实验之声广播站</b>
            的一体化系统，包含歌曲投稿，歌曲审核，一键排歌，导出歌单等功能。
          </p>
          <p>
            这个项目的代码是开源的，你可以在
            <NuxtLink
              to="https://github.com/ljk743121/Sound-of-experiment"
              class="font-semibold underline underline-offset-4"
            >
              <span>这里</span>
            </NuxtLink>
            查看源代码。期待各位同学的反馈！
          </p>
          <p>
            该项目的使用文档以及开发文档可在
            <NuxtLink
              to="https://voszsy.netlify.app/"
              class="font-semibold underline underline-offset-4"
            >
              <span>这里</span>
            </NuxtLink>
            查看。
          </p>
        </section>

        <section>
          <p>
            致谢：
            <NuxtLink
              to="https://qijieya.cn/"
              class="font-semibold underline underline-offset-4"
            >
              <span>锦木祈杰</span>
            </NuxtLink>
            提供的二级域名
          </p>
        </section>

        <section>
          <p>
            项目贡献者：
          </p>
          <NuxtImg src="https://contrib.rocks/image?repo=ljk743121/Sound-of-experiment" alt="Contributors" sizes="full" />
        </section>

        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">Made by
            <NuxtLink
              to="https://github.com/ljk743121"
              class="font-semibold underline underline-offset-4"
            >@Ljk743121</NuxtLink>
            and other contributors</span>
          <div class="flex gap-2">
            <NuxtLink to="https://github.com/ljk743121/Sound-of-experiment" target="_blank">
              <Button variant="outline" size="icon">
                <Icon name="lucide:github" />
              </Button>
            </NuxtLink>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </ClientOnly>
</template>
