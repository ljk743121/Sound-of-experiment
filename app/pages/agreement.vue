<template>
  <div class="container mx-auto px-4 py-8 md:py-12">
    <Card class="mx-auto max-w-4xl">
      <CardHeader class="border-b pb-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-2">
            <CardTitle class="text-2xl font-bold tracking-tight md:text-3xl">
              用户协议和隐私政策
            </CardTitle>
            <CardDescription class="text-base">
              SchoolFm 点歌系统服务条款与个人信息处理说明
            </CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge variant="secondary" class="h-fit">
              更新日期：2026/7/15
            </Badge>
            <Badge variant="outline" class="h-fit">
              生效日期：2026/7/15
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-10 pt-6">
        <!-- 导言 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            导言
          </h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span class="font-medium text-foreground">SchoolFm</span>
              是一款由
              <span class="font-medium text-foreground">ljk743121 以及其他贡献者</span>
              （以下简称"我们"）提供的产品。您在使用我们的服务时，我们可能会收集和使用您的相关信息。我们希望通过本《用户协议和隐私政策》向您说明，在使用我们的服务时，我们如何收集、使用、储存和分享这些信息，以及我们为您提供的访问、更新、控制和保护这些信息的方式。
            </p>
            <p>
              本《用户协议和隐私政策》与您所使用的
              <span class="font-medium text-foreground">SchoolFm</span>
              服务息息相关，希望您仔细阅读，在需要时，按照本《用户协议和隐私政策》的指引，作出您认为适当的选择。本《用户协议和隐私政策》中涉及的相关技术词汇，我们尽量以简明扼要的表述，并提供进一步说明的链接，以便您的理解。
            </p>
          </div>
          <div class="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm font-medium text-foreground">
            您使用或继续使用我们的服务，即意味着同意我们按照本《用户协议和隐私政策》收集、使用、储存和分享您的相关信息。
          </div>
          <p class="text-muted-foreground leading-relaxed">
            如对本《用户协议和隐私政策》或相关事宜有任何问题，请通过
            <Button variant="link" as-child class="h-auto p-0 text-base">
              <a href="https://github.com/ljk743121/SchoolFm/issues" target="_blank" rel="noopener noreferrer">
                GitHub Issues
              </a>
            </Button>
            与我们联系。
          </p>
        </section>

        <Separator />

        <!-- 1. 我们收集的信息 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            1. 我们收集的信息
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            我们或我们的第三方合作伙伴提供服务时，可能会收集、储存和使用下列与您有关的信息。如果您不提供相关信息，可能无法注册成为我们的用户或无法享受我们提供的某些服务，或者无法达到相关服务拟达到的效果。
          </p>
          <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
            <li>
              <span class="font-medium text-foreground">个人信息</span>，您在注册账户或使用我们的服务时，向我们提供的相关个人信息，例如学号、真实姓名、昵称等。
            </li>
          </ul>
        </section>

        <!-- 2. 信息的存储 -->
        <section class="space-y-6">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            2. 信息的存储
          </h2>

          <div class="space-y-3">
            <h3 class="font-semibold text-foreground">
              2.1 信息存储的方式和期限
            </h3>
            <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
              <li>我们会通过安全的方式存储您的信息，包括本地存储（例如利用 Web 浏览器进行数据缓存）、数据库和服务器日志。</li>
              <li>一般情况下，我们只会在为实现服务目的所必需的时间内或法律法规规定的条件下存储您的个人信息。</li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="font-semibold text-foreground">
              2.2 信息存储的地域
            </h3>
            <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
              <li>信息存储的地域为服务器和数据库所在地域，可包括但不限于中国境内。</li>
              <li>若跨境传输或存储您的个人信息，我们会向您告知信息出境的目的、接收方、安全保证措施和安全风险，并征得您的同意。</li>
              <li>本网站部署于 Vercel 平台，数据库存储于 Neon 平台。</li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="font-semibold text-foreground">
              2.3 产品或服务停止运营时的通知
            </h3>
            <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
              <li>当我们的产品或服务发生停止运营的情况时，我们将以推送通知、公告等形式通知您，并在合理期限内删除您的个人信息或进行匿名化处理，法律法规另有规定的除外。</li>
            </ul>
          </div>
        </section>

        <!-- 3. 信息安全 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            3. 信息安全
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            我们使用各种安全技术和程序，以防信息的丢失、不当使用、未经授权阅览或披露。例如，在某些服务中，我们将利用加密技术（例如 SSL）来保护您提供的个人信息。但请您理解，由于技术的限制以及可能存在的各种恶意手段，在互联网行业，即便竭尽所能加强安全措施，也不可能始终保证信息百分之百的安全。您需要了解，您接入我们的服务所用的系统和通讯网络，有可能因我们可控范围外的因素而出现问题。
          </p>
        </section>

        <!-- 4. 我们如何使用信息 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            4. 我们如何使用信息
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            我们可能将在向您提供服务的过程之中所收集的信息用作下列用途：
          </p>
          <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
            <li>向您提供服务；</li>
            <li>在我们提供服务时，用于身份验证、客户服务、安全防范、诈骗监测、存档和备份用途，确保我们向您提供的产品和服务的安全性；</li>
            <li>帮助我们设计新服务，改善我们现有服务；</li>
            <li>使我们更加了解您如何接入和使用我们的服务，从而针对性地回应您的个性化需求，例如语言设定、位置设定、个性化的帮助服务和指示，或对您和其他用户作出其他方面的回应；</li>
            <li>向您提供与您更加相关的广告以替代普遍投放的广告；</li>
            <li>评估我们服务中的广告和其他促销及推广活动的效果，并加以改善；</li>
            <li>软件认证或管理软件升级；</li>
            <li>让您参与有关我们产品和服务的调查。</li>
          </ul>
        </section>

        <!-- 5. 信息共享 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            5. 信息共享
          </h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              目前，我们不会主动共享或转让您的个人信息至第三方，如存在其他共享或转让您的个人信息或您需要我们将您的个人信息共享或转让至第三方情形时，我们会直接或确认第三方征得您对上述行为的明示同意。
            </p>
            <p>
              为了投放广告，评估、优化广告投放效果等目的，我们需要向广告主及其代理商等第三方合作伙伴共享您的部分数据，要求其严格遵守我们关于数据隐私保护的措施与要求，包括但不限于根据数据保护协议、承诺书及相关数据处理政策进行处理，避免识别出个人身份，保障隐私安全。
            </p>
            <p>
              我们不会向合作伙伴分享可用于识别您个人身份的信息（例如您的学号、真实姓名、昵称），除非您明确授权。
            </p>
            <p>
              我们不会对外公开披露所收集的个人信息，如必须公开披露时，我们会向您告知此次公开披露的目的、披露信息的类型及可能涉及的敏感信息，并征得您的明示同意。
            </p>
            <p>
              随着我们业务的持续发展，我们有可能进行合并、收购、资产转让等交易，我们将告知您相关情形，按照法律法规及不低于本《用户协议和隐私政策》所要求的标准继续保护或要求新的控制者继续保护您的个人信息。
            </p>
            <p>
              另外，根据相关法律法规及国家标准，以下情形中，我们可能会共享、转让、公开披露个人信息无需事先征得您的授权同意：
            </p>
          </div>
          <ul class="ml-6 list-disc space-y-2 text-muted-foreground marker:text-primary">
            <li>与国家安全、国防安全直接相关的；</li>
            <li>与公共安全、公共卫生、重大公共利益直接相关的；</li>
            <li>犯罪侦查、起诉、审判和判决执行等直接相关的；</li>
            <li>出于维护个人信息主体或其他个人的生命、财产等重大合法权益但又很难得到本人同意的；</li>
            <li>个人信息主体自行向社会公众公开个人信息的；</li>
            <li>从合法公开披露的信息中收集个人信息的，如合法的新闻报道、政府信息公开等渠道。</li>
          </ul>
        </section>

        <!-- 6. 您的权利 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            6. 您的权利
          </h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              在您使用我们的服务期间，我们可能会视产品具体情况为您提供相应的操作设置，以便您可以查询、删除、更正或撤回您的相关个人信息，您可参考相应的具体指引进行操作。此外，我们还设置了投诉举报渠道，您的意见将会得到及时的处理。如果您无法通过上述途径和方式行使您的个人信息主体权利，您可以通过本《用户协议和隐私政策》中提供的联系方式提出您的请求，我们会按照法律法规的规定予以反馈。
            </p>
            <p>
              当您决定不再使用我们的产品或服务时，可以申请注销账户。注销账户后，除法律法规另有规定外，我们将删除或匿名化处理您的个人信息。
            </p>
          </div>
        </section>

        <!-- 7. 变更 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            7. 变更
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            我们可能适时修订本《用户协议和隐私政策》的条款。当变更发生时，我们会在版本更新时向您提示新的《用户协议和隐私政策》，并向您说明生效日期。请您仔细阅读变更后的《用户协议和隐私政策》内容，
            <span class="font-medium text-foreground">若您继续使用我们的服务，即表示您同意我们按照更新后的《用户协议和隐私政策》处理您的个人信息。</span>
          </p>
        </section>

        <!-- 8. 免责声明 -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold tracking-tight text-foreground">
            8. 免责声明
          </h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span class="font-medium text-foreground">SchoolFm</span>
              是一款面向校园广播场景的开源点歌系统，我们按"现状"和"可用性"提供本服务，不对服务的及时性、安全性、准确性、连续性作出任何明示或暗示的保证。
            </p>
            <p>
              您理解并同意，因网络状况、第三方服务（如 Vercel、Neon 等）、系统维护、不可抗力或其他非我们可控因素导致的服务中断、数据丢失、信息泄露或其他损失，除法律法规另有明确规定外，我们不承担赔偿责任。
            </p>
            <p>
              您在使用本服务过程中发布、传播或使用的任何内容（包括但不限于投稿歌曲、评论、昵称等）均由您自行承担法律责任。我们仅提供技术支持，不对用户行为的合法性、适当性负责。
            </p>
            <p>
              本服务可能包含指向第三方网站或服务的链接，访问这些链接所产生的风险由您自行承担，我们对第三方网站或服务的内容、隐私政策及安全性不承担任何责任。
            </p>
            <p>
              在法律允许的最大范围内，我们对因使用或无法使用本服务所引起的任何直接、间接、附带、惩罚性或后果性损害不承担责任。
            </p>
          </div>
        </section>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "用户协议和隐私政策",
});
</script>
