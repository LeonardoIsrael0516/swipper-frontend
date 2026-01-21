import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AffiliateTerms() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Termo de Adesão ao Programa de Afiliados Swipper</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <p className="text-muted-foreground">
                  Este Termo de Adesão ao Programa de Afiliados Swipper formaliza o acordo completo entre o Afiliado e a Swipper, 
                  pessoa jurídica de direito privado, regularmente registrada. Sendo a Swipper a única proprietária dos direitos 
                  de propriedade intelectual e detentora dos direitos sobre o Software Swipper, concedendo ao Afiliado, por meio 
                  deste documento, o direito de disponibilizar link de acesso a terceiros para compra dos planos de acesso à 
                  Plataforma Swipper ("Plataforma"), percebendo remuneração correspondente.
                </p>

                <p>
                  Este contrato define o escopo da relação entre as partes, sendo que o Afiliado afirma ter lido, entendido e 
                  aceitado todas as condições apresentadas neste acordo.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA PRIMEIRA – DO OBJETIVO DO PROGRAMA</h2>
                <p>
                  O objeto do presente termo de adesão é a afiliação ao Programa De Afiliados Swipper, na plataforma, sendo um 
                  serviço oferecido por meio de página eletrônica na internet que oferece ao parceiro, a possibilidade de disponibilizar 
                  link específico (de produção, propriedade e vinculado à Swipper) ao consumidor final, que comprará produto ou serviço 
                  da Swipper, recebendo o AFILIADO, em contrapartida, uma comissão, após a confirmação da compra e o recebimento de 
                  valores do cliente, que adquiriu o produto ou serviço por meio de link.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA SEGUNDA – DO REGISTRO NO PROGRAMA</h2>
                <p>
                  Não serão cobrados quaisquer valores do Afiliado para a vinculação ao programa, sua vinculação ocorrerá de forma 
                  gratuita, o que lhe garantirá integração e acesso ao Programa De Afiliados Swipper, bem como acesso a aba específica 
                  no Dashboard da Plataforma Swipper voltada à gestão do presente Programa de Afiliados.
                </p>
                <p>
                  O AFILIADO declara que leu e concorda com todos os termos e condições previstos neste termo de adesão. Para participar 
                  do Programa, o AFILIADO declara que preencheu corretamente na plataforma, com as informações solicitadas na ficha de 
                  cadastro.
                </p>
                <p>
                  A partir da finalização do cadastro na Plataforma, o AFILIADO será aceito automaticamente no programa, estando a Swipper 
                  autorizada a solicitar dados adicionais do mesmo, tanto da pessoa jurídica cadastrada quanto do sócio e/ou empresário 
                  individual pessoa física, ou da pessoa física cadastrada, bem como a ou a retificação de informações, para a manutenção 
                  da pessoa cadastrada no Programa.
                </p>
                <p>
                  A plataforma reserva-se no direito de não aprovar o cadastro do AFILIADO ou excluí-lo do Programa de Afiliados Swipper 
                  na hipótese de divulgação de qualquer material, imagem ou conteúdo em discordância com quaisquer de seus princípios, 
                  políticas ou legislação vigente.
                </p>
                <p>
                  A Swipper reserva-se, ainda, ao direito de descadastrar do Programa o AFILIADO, a qualquer tempo e por mera liberalidade, 
                  sem que isso implique responsabilidades indenizatórias para a Swipper.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA TERCEIRA – CARACTERÍSTICAS DO PROGRAMA</h2>
                <p>
                  O AFILIADO declara-se ciente que a Plataforma Swipper é de propriedade exclusiva da Swipper, portanto, constituindo 
                  relação comercial/jurídica com o Site Parceiro, responsabilizando o AFILIADO pelas infrações aos regramentos dispostos 
                  no presente termo de adesão.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">São condutas permitidas ao Afiliado:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Realizar a divulgação por meio de listas de prospecção de contatos, incluindo WhatsApp, SMS, e-mail, Telegram e chamadas telefônicas, sempre respeitando a propriedade intelectual da Swipper, assim como sua missão e valores, além de cumprir com as exigências da Lei Geral de Proteção de Dados (LGPD).</li>
                  <li>Realizar vendas tanto para o segmento B2B (business-to-business) quanto B2C (business-to-consumer), desde que o AFILIADO seja devidamente identificado e autorizado para atuar conforme estabelecido no Programa de Afiliados Swipper.</li>
                  <li>Impulsionar vendas através de estratégias de tráfego pago ou orgânico, respeitando as demais regras oriundas da lei e do presente contrato, bem como os princípios da boa-fé e da transparência.</li>
                  <li>Investir em qualquer tipo de serviço de publicidade paga fornecido por plataformas ou motores de busca, como Google e Bing, sendo importante destacar que quaisquer vendas geradas por tráfego advindo desses anúncios resultarão no estorno das comissões que seriam originalmente atribuídas ao AFILIADO.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Constituem práticas vedadas ao AFILIADO:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Comercializar produtos ou serviços em marketplaces e e-commerces onde lojistas se inscrevem para vender, tais como Mercado Livre, Americanas, entre outros que, por sua natureza, bem como vontade do proprietário, usuário ou da Swipper, seja vedada a divulgação.</li>
                  <li>Recrutar ou tentar recrutar clientes diretamente nas redes sociais oficiais da Swipper.</li>
                  <li>Recrutar ou tentar recrutar clientes durante transmissões ao vivo (lives) da Swipper, ou quaisquer propagandas por si utilizadas.</li>
                  <li>Falsamente se declarar como funcionário, sócio, acionista e/ou terceirizado da Swipper.</li>
                  <li>Realizar a divulgação dos produtos e serviços em sites de conteúdo ilícito, imoral ou degradante, incompatível com os princípios da empresa, ou em contextos que possam comprometer a imagem da Swipper.</li>
                  <li>Cadastrar uma Pessoa Jurídica já registrada por outro afiliado, sendo que qualquer sócio adicional não registrado que deseje participar do programa deve vincular-se a uma nova Pessoa Jurídica para fins de recebimento de comissão.</li>
                  <li>Executar campanhas de links patrocinados em motores de busca que utilizem a marca ou imagem da Swipper de forma isolada ou associada a concorrentes, derivativos, prefixos, sufixos ou termos similares.</li>
                  <li>Copiar, modificar, reproduzir, distribuir, fazer download, armazenar, transmitir, vender, revender, realizar engenharia reversa, traduzir, decompilar, copiar, alugar, emprestar, licenciar ou criar produtos derivados de qualquer conteúdo da plataforma sem a devida autorização expressa e por escrito.</li>
                  <li>Violar ou tentar violar medidas de segurança da plataforma, seus termos de uso ou políticas de privacidade, aproveitar-se de falhas do sistema para obter vantagens indevidas, acessar contas de outros usuários, ou divulgar senhas de outros AFILIADOS ou usuários.</li>
                  <li>Submeter à Swipper informações falsas, imprecisas ou incompletas.</li>
                  <li>Impersonar outra pessoa ou entidade, bem como praticar, face à Swipper, crimes de falsidade ideológica.</li>
                  <li>Agredir, caluniar, injuriar ou difamar outros AFILIADOS, terceiros ou potenciais clientes, usar linguagem imprópria ou ofensiva, ou praticar atos prejudiciais à marca ou à reputação da Swipper ou empresas associadas.</li>
                  <li>Engajar-se em publicidade enganosa ou abusiva, incluindo a prática de enviar comunicações não solicitadas (spam), fazer afirmações falsas sobre produtos ou serviços, ou utilizar qualquer forma de promoção que possa ser interpretada como enganosa ou abusiva pelo público.</li>
                </ul>

                <p className="mt-4">
                  Toda política comercial adotada pelo AFILIADO deverá seguir as regras da Swipper, acerca do preço, promoção e parcelas, 
                  não podendo ser cobrado pelo AFILIADO taxas adicionais do possível novo Usuário pelo envio do link.
                </p>
                <p>
                  A prática pelo AFILIADO, direta ou indiretamente, de qualquer conduta contrária aos termos desta cláusula implicará 
                  em estorno e não pagamento das comissões futuras, além de medidas punitivas, a serem aplicadas de acordo com a gravidade, 
                  tais como encerramento do cadastro do AFILIADO, inclusive podendo encerrar o cadastro do mesmo como Usuário da Plataforma, 
                  a critério da Swipper.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA QUARTA – CADASTRAMENTO NO PROGRAMA</h2>
                <p>
                  O AFILIADO declara que para o início no Programa de Afiliados Swipper, o mesmo se cadastrou na plataforma, cadastrando-se 
                  como pessoa física ou jurídica, declarando para estes fins que prestou todas as informações de dados de identificação, 
                  pagamento e contato de maneira verídica, e tão exatas quanto necessárias, comprometendo-se a altera-las ou corrigi-las, 
                  tão logo identifique incorreções ou alterações nos dados fornecidos.
                </p>
                <p>
                  O AFILIADO declara que leu atentamente e concorda integralmente com todos os termos e condições estipulados neste Termo 
                  de Adesão ao Programa de Afiliados, declarando especial ciência, reconhecendo e aceitando que o presente Termo pode ser 
                  rescindido unilateralmente e a qualquer momento, por mera liberalidade de qualquer das partes, conforme previsto neste 
                  contrato. Entende também que a Swipper não está obrigada a manter indefinidamente o programa de afiliados e pode decidir 
                  pelo seu encerramento ou pela exclusão de participantes a seu exclusivo critério.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA QUINTA – DA COMISSÃO E DAS PROGRESSÕES</h2>
                <p>
                  O AFILIADO terá direito a remuneração a título de comissão na importância de 10% sobre o valor de cada plano contratado 
                  por meio de seu link de afiliado. Esta comissão será paga mensalmente, pelo período de seis meses a contar da data em que 
                  o novo Usuário se vincular à plataforma através do link do afiliado.
                </p>
                <p>
                  Os pagamentos das comissões serão efetuados 33 dias após a vinculação do novo usuário à plataforma. O crédito correspondente 
                  só estará disponível para o afiliado após esse período. Os valores das comissões poderão ser consultados pelo AFILIADO em 
                  uma aba própria dentro de sua conta de usuário na plataforma Swipper, facilitando o acompanhamento e gestão de suas receitas.
                </p>
                <p>
                  A obrigatoriedade do pagamento da comissão ao AFILIADO está condicionada ao efetivo pagamento do plano pelo Usuário. Caso o 
                  usuário não efetue o pagamento, solicite o cancelamento ou a devolução da comissão, o afiliado não terá direito a receber a 
                  comissão correspondente.
                </p>
                <p>
                  Os pagamentos das comissões serão realizados diretamente na conta bancária informado pelo AFILIADO e regularmente cadastrada 
                  na Plataforma Swipper, sendo deste a responsabilidade pelas corretas declarações e informações de pagamento e contato informadas 
                  na plataforma.
                </p>
                <p>
                  A Swipper estará autorizada a reter temporariamente os repasses de comissões ao AFILIADO em caso de verificação de irregularidades 
                  nas atividades do mesmo. Além disso, a Swipper poderá reter definitivamente e não proceder ao pagamento das comissões caso seja 
                  constatado pelo AFILIADO um sério descumprimento contratual ou legal.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA SEXTA – DA PROPRIEDADE INTELECTUAL</h2>
                <p>
                  A Swipper detém todos os direitos de propriedade intelectual, abrangendo direitos morais e patrimoniais, sobre a Plataforma e 
                  seus componentes, bem como sobre a marca "Swipper" e suas variáveis, incluindo funcionalidades, marcas registradas, software, 
                  domínios, e qualquer outro direito de propriedade intelectual associado à Plataforma e aos Serviços fornecidos.
                </p>
                <p>
                  A Swipper é igualmente detentora de qualquer conteúdo e material disponível e/ou exibido na plataforma e/ou seus sites, 
                  declarando ser de sua propriedade intelectual, razão pela qual reserva a si todos os direitos de propriedade intelectual, 
                  incluindo mas não se limitando a gráficos, documentos, textos, imagens, ícones, fotografias, logos, gravações, softwares, 
                  marcas, programas de computador, banco de dados, redes, arquivos e códigos-fonte, dentre outros.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA SÉTIMA – DAS OBRIGAÇÕES E RESPONSABILIDADES DO AFILIADO</h2>
                <p>
                  Além das obrigações e responsabilidades assumidas neste termo, o AFILIADO declara e se compromete a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Não promover, na qualidade de afiliado ou influenciador digital, produtos ou serviços que sejam diretamente concorrentes aos oferecidos pela Swipper, tanto em ambientes online quanto offline.</li>
                  <li>Cumprir rigorosamente todas as cláusulas estipuladas neste termo.</li>
                  <li>Manter suas informações pessoais e de contato atualizadas na plataforma da Swipper, realizando atualizações sempre que ocorrerem alterações, sob pena de se considerarem válidas as informações previamente fornecidas.</li>
                  <li>Observar as leis aplicáveis que proíbem fraude, bem como a veiculação de conteúdos e a realização de comércio ilegais.</li>
                  <li>Garantir que tanto ele quanto seus representantes, prepostos e terceiros que obtenham acesso à plataforma por seu intermédio respeitem todos os direitos relacionados aos programas, marcas, sistemas, códigos e outros bens imateriais de propriedade da Swipper e de seus parceiros.</li>
                  <li>Abster-se de utilizar ou permitir o uso de métodos fraudulentos ou artificiais para gerar vendas ou receitas no âmbito do Programa de Afiliados Swipper.</li>
                  <li>Possuir mais de 18 anos ou ser emancipado, estar em pleno exercício de suas capacidades civis, possuir CPF válido e atender a outros requisitos legais necessários para a operacionalização junto à empresa.</li>
                  <li>Preservar e promover a boa reputação da marca Swipper, agindo sempre com diligência e zelo pelo nome, marca e/ou produtos da empresa.</li>
                  <li>Assumir todos os ônus e responsabilidades decorrentes de seus atos, bem como responder por atos praticados por terceiros em seu nome, garantindo à Swipper o direito de regresso, caso esta venha a ser responsabilizada administrativa ou judicialmente em decorrência de tais atos.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA OITAVA – DAS OBRIGAÇÕES E RESPONSABILIDADES DA SWIPPER</h2>
                <p>
                  Além das obrigações e responsabilidades assumidas no presente termo, a Swipper se compromete em:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Checar os dados informados pelo AFILIADO no cadastro, e enviar uma notificação via plataforma e/ou e-mail, informando se a disposição solicitada foi aceita ou recusada. Não serão aceitos contratos duplos, ou seja, somente é aceito um contrato por CPF ou CNPJ.</li>
                  <li>Disponibilizar o acesso do AFILIADO à Plataforma, mediante o fornecimento de login e senha de acesso, bem como um Link de vendas para divulgação e computo de vendas a terceiros.</li>
                  <li>Efetuar ao AFILIADO os pagamentos nos valores, nas datas e modo ajustados.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA NONA – DA VIGÊNCIA</h2>
                <p>
                  O contrato entrará em vigor na data de cadastro do AFILIADO ao Programa de Afiliados Swipper, e terá validade por prazo indeterminado, 
                  podendo ser rescindido a qualquer tempo pela vontade das partes, por mera liberalidade, sem que importe na aplicação de qualquer penalidade.
                </p>
                <p>
                  Em caso de desinteresse no prosseguimento da relação pelo AFILIADO, o mesmo poderá proceder ao cancelamento da presente relação de 
                  maneira automática, na própria Plataforma Swipper, na página de Dashboard do Afiliado.
                </p>
                <p>
                  Caso seja identificado qualquer descumprimento contratual ou legal pelo AFILIADO, poderá a Swipper proceder à exclusão do mesmo do 
                  Programa de Afiliados, automaticamente, independentemente de notificação, bem como suspender ou reter pagamentos devidos, em virtude 
                  de eventual dano ou prejuízo efetivamente sofrido, ou potencial, desde que de média e alta probabilidade.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA DÉCIMA – DO SIGILO E DA CONFIDENCIALIDADE</h2>
                <p>
                  São consideradas informações de natureza confidencial, sendo vedada as partes a divulgação de referidas informações pelo prazo que 
                  vigorar este contrato, e por 5 (cinco) anos contados de sua resolução, independentemente do motivo que a fundamenta, as seguintes, 
                  mas não se limitando a: dados relacionados a operações comerciais, estratégias financeiras, detalhes de produtos, procedimentos 
                  operacionais, informações de bancos de dados, expertise exclusivo, descobertas inovadoras, propostas conceituais, avanços tecnológicos, 
                  softwares, esquemáticos, sequências operacionais, progressos em desenvolvimento, e registros de clientes e parceiros, ou qualquer 
                  outra informação de natureza técnica, econômica ou de mercado obtida durante o curso desta relação contratual.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA DÉCIMA PRIMEIRA - DA POLÍTICA DE PRIVACIDADE</h2>
                <p>
                  A Swipper está comprometida com a proteção da privacidade e dos dados pessoais coletados e tratados em suas atividades, incluindo 
                  aqueles obtidos por meio do Programa de Afiliados. Todos os dados pessoais relacionados ao AFILIADO e aos usuários da plataforma são 
                  processados de acordo com as disposições contidas na Política de Privacidade da Swipper.
                </p>
                <p>
                  A Política de Privacidade da Swipper detalha como os dados pessoais são coletados, usados, compartilhados e protegidos, bem como 
                  esclarece os direitos dos titulares desses dados. O AFILIADO deve compreender e concordar com esses termos, reconhecendo que a 
                  participação no Programa de Afiliados implica a aceitação da referida política.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">CLÁUSULA DÉCIMA SEGUNDA – DAS DISPOSIÇÕES FINAIS</h2>
                <p>
                  Obrigam-se as partes e anuentes por si, seus herdeiros e sucessores, em caráter irretratável e irrevogável, sendo vedada a cessão 
                  a terceiro pelo AFILIADO dos direitos, obrigações e responsabilidades oriundas do presente sem a prévia e expressa anuência da outra 
                  parte, sob todos os termos e condições expressamente previstos neste instrumento de contrato.
                </p>
                <p>
                  O AFILIADO concorda que todos os atos de comunicação formal de natureza judicial entre si deverão ocorrer nos endereços de e-mail 
                  informados no ato de cadastro na Plataforma, admitindo-se inclusive a citação e intimação judicial, sendo presumida a ciência no 
                  primeiro dia útil posterior ao recebimento.
                </p>
                <p>
                  As partes reconhecem, admitem e concordam que o presente contrato estabelece uma relação de natureza comercial entre si, na qual o 
                  AFILIADO, qualificado como profissional em seu respectivo setor de atuação, adere ao presente programa com o objetivo de enriquecimento 
                  pessoal e desenvolvimento de nova fonte de renda, portanto o AFILIADO possui conhecimento técnico sobre o funcionamento e operação 
                  de mercado relativa a programas de afiliados. Deste modo, esta relação não configura uma relação de consumo.
                </p>
                <p>
                  O AFILIADO admite ciência e concorda que o presente Termo de Adesão ao Programa de Afiliados Swipper poderá ser a qualquer tempo 
                  modificado unilateralmente pela Swipper, a seu exclusivo critério, sendo que o aceite do AFILIADO em novo Termo de Adesão importa na 
                  vinculação dos mesmos, em todos os seus termos e condições. A Swipper compromete-se a comunicar referida alteração via e-mail e/ou 
                  plataforma.
                </p>
                <p>
                  Este acordo é regido e deverá ser interpretado de acordo com as leis vigentes na República Federativa do Brasil, aplicando-se a todos 
                  os termos e condições aqui estabelecidos.
                </p>
                <p>
                  A Swipper poderá, a qualquer tempo e independentemente de prévio aviso, encerrar o Programa Swipper AFILIADO, não sendo devida nenhuma 
                  indenização ao AFILIADO em decorrência desta decisão, exceto os valores decorrentes de negócios efetivamente realizados e ainda não pagos.
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

