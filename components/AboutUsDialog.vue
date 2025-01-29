<template>
  <UiDialog>
    <UiDialogTrigger as-child>
      <slot />
    </UiDialogTrigger>
    <UiDialogContent class="w-[92vw] rounded-md">
      <UiDialogHeader>
        <UiDialogTitle class="text-xl font-bold text-start">
          关于我们
        </UiDialogTitle>
      </UiDialogHeader>
      <div class="flex flex-col my-2">
        <LogosThe1068fm class="mx-auto mb-4 w-[50%]" />
        <section class="prose">
          <p>
            <em>the1068fm</em> 是由<b>COSMO智慧校园平台运研中心</b>为<b>风华子衿广播站</b>声声慢点歌节目开发的一体化系统，包含歌曲投稿，歌曲审核，一键排歌，导出歌单等功能。
          </p>
          <p>
            此版本由Ljk进行修改,仅用于实验之声广播站的点歌节目。
          </p>
          <p>
            这个项目的代码是开源的，你可以在
            <NuxtLink to="https://github.com/ljk743121/the1068fm" class="font-bold">
              <span>这里</span>
            </NuxtLink>
            查看源代码。期待各位同学的反馈！
          </p>
        </section>
      </div>
      <UiDialogFooter>
        <UiDialogClose as-child>
          <UiButton type="button" variant="secondary" class="ml-auto px-6">
            好的
          </UiButton>
        </UiDialogClose>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
