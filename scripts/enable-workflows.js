#!/usr/bin/env node

/**
 * Script para habilitar workflows con datos de prueba
 * Ejecuta múltiples operaciones para configurar el sistema de workflows
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enableWorkflows() {
  console.log('🔄 Habilitando sistema de workflows...');
  
  try {
    // 1. Crear datos de prueba para workflow items
    console.log('📊 Creando workflow items de prueba...');
    
    const workflowItems = [
      // Workflow CL (Cotizaciones)
      {
        id: 'cl-workflow-001',
        project_id: 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7',
        product_type: 'CL',
        product_name: 'Sistema de Videoconferencia',
        current_step: 'solicitar_cotizacion',
        step_data: {
          productDescription: 'Sistema completo de videoconferencia para sala de juntas',
          quantity: 1,
          supplierName: 'TechPro Solutions',
          supplierEmail: 'cotizaciones@techpro.com',
          estimatedCost: 3500.00,
          notes: 'Incluir instalación y configuración'
        },
        created_by: '3d665a99-7636-4ef9-9316-f8065d010b26'
      },
      {
        id: 'cl-workflow-002',
        project_id: 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7',
        product_type: 'CL',
        product_name: 'Licencias Microsoft Office',
        current_step: 'pagar_cotizacion',
        step_data: {
          productDescription: 'Licencias Office 365 Business Premium',
          quantity: 50,
          supplierName: 'Microsoft Partner',
          supplierEmail: 'ventas@mspartner.com',
          quotationAmount: 2500.00,
          quotationReceived: new Date().toISOString(),
          notes: 'Licencias anuales con soporte'
        },
        created_by: '3d665a99-7636-4ef9-9316-f8065d010b26'
      },
      // Workflow IMP (Importaciones)
      {
        id: 'imp-workflow-001',
        project_id: 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7',
        product_type: 'IMP',
        product_name: 'Servidores Dell PowerEdge',
        current_step: 'pagar_pi_proveedor',
        step_data: {
          productDescription: 'Servidores Dell PowerEdge R750 con configuración personalizada',
          quantity: 2,
          supplierName: 'Dell Technologies',
          supplierEmail: 'enterprise@dell.com',
          piAmount: 15000.00,
          isAirShipping: true,
          estimatedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Configuración especial para centro de datos'
        },
        created_by: '3d665a99-7636-4ef9-9316-f8065d010b26'
      },
      {
        id: 'imp-workflow-002',
        project_id: 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7',
        product_type: 'IMP',
        product_name: 'Componentes Especializados',
        current_step: 'enviar_etiqueta_envio',
        step_data: {
          productDescription: 'Sensores IoT y microcontroladores especializados',
          quantity: 100,
          supplierName: 'Shenzhen Electronics Co.',
          supplierEmail: 'export@szelec.com',
          piAmount: 5000.00,
          piPaidDate: new Date().toISOString(),
          isAirShipping: false,
          shippingType: 'Marítimo',
          notes: 'Envío por contenedor, tiempo estimado 45 días'
        },
        created_by: '3d665a99-7636-4ef9-9316-f8065d010b26'
      },
      {
        id: 'imp-workflow-003',
        project_id: 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7',
        product_type: 'IMP',
        product_name: 'Equipos de Laboratorio',
        current_step: 'pagar_arancel_aduanas',
        step_data: {
          productDescription: 'Microscopios y equipos de análisis científico',
          quantity: 5,
          supplierName: 'German Scientific GmbH',
          supplierEmail: 'sales@germanscientific.de',
          piAmount: 25000.00,
          piPaidDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          shippingLabelSent: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          customsDutyAmount: 3750.00,
          isAirShipping: true,
          notes: 'Equipos delicados, requieren manejo especial'
        },
        created_by: '3d665a99-7636-4ef9-9316-f8065d010b26'
      }
    ];

    // Insertar workflow items
    const { data: insertedItems, error: insertError } = await supabase
      .from('workflow_items')
      .insert(workflowItems);

    if (insertError) {
      console.error('❌ Error insertando workflow items:', insertError);
      return;
    }

    console.log('✅ Workflow items creados exitosamente');

    // 2. Verificar que los workflows se crearon correctamente
    const { data: workflows, error: fetchError } = await supabase
      .from('workflow_items')
      .select('*')
      .eq('project_id', 'c65be4cc-4a12-4553-b6d4-5bdf9e097fc7');

    if (fetchError) {
      console.error('❌ Error verificando workflows:', fetchError);
      return;
    }

    console.log(`✅ ${workflows.length} workflows activos encontrados`);

    // 3. Mostrar resumen por tipo
    const clWorkflows = workflows.filter(w => w.product_type === 'CL');
    const impWorkflows = workflows.filter(w => w.product_type === 'IMP');

    console.log('\n📊 Resumen de Workflows:');
    console.log(`  📋 CL (Cotizaciones): ${clWorkflows.length} workflows`);
    console.log(`  ✈️  IMP (Importaciones): ${impWorkflows.length} workflows`);

    // 4. Mostrar estados actuales
    console.log('\n🔄 Estados Actuales:');
    workflows.forEach(w => {
      console.log(`  • ${w.product_name}: ${w.current_step}`);
    });

    console.log('\n🎉 Sistema de workflows habilitado exitosamente!');
    console.log('💡 Los dashboards ahora mostrarán estos workflows en tiempo real');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
enableWorkflows().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
});