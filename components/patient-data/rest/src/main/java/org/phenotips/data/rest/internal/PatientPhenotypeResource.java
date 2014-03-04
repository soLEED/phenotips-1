/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package org.phenotips.data.rest.internal;

import org.phenotips.Constants;
import org.phenotips.data.Patient;
import org.phenotips.data.rest.PatientPhenotypeInterface;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.EntityType;
import org.xwiki.model.reference.EntityReference;
import org.xwiki.rest.XWikiResource;
import org.xwiki.rest.XWikiRestException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.xpn.xwiki.XWikiException;
import com.xpn.xwiki.api.Document;
import com.xpn.xwiki.doc.XWikiDocument;
import com.xpn.xwiki.objects.BaseObject;
import com.xpn.xwiki.objects.BaseStringProperty;

/**
 * Resource for listing full patient phenotype.
 *
 * @version $Id$
 */
@Component("org.phenotips.data.rest.internal.PatientPhenotypeResource")
public class PatientPhenotypeResource extends XWikiResource implements PatientPhenotypeInterface
{
    private static final EntityReference PHENOTYPE_CLASS_REFERENCE =
        new EntityReference("PhenotypeMetaClass", EntityType.DOCUMENT,
            Constants.CODE_SPACE_REFERENCE);

    @Override
    public Map<String, Map<String, String>> getAllPhenotypes(String patientId, String wikiName)
        throws XWikiRestException, XWikiException
    {
        Boolean withPrettyNames = true;
        String space = Patient.DEFAULT_DATA_SPACE.getName();
        Document apiDoc = getDocumentInfo(wikiName, space, patientId, null, null, true, true).getDocument();
        XWikiDocument doc = apiDoc.getDocument();
        //The XWiki representation of phenotype objects within the patient document.
        List<BaseObject> phenotypeObjects = doc.getXObjects(PHENOTYPE_CLASS_REFERENCE);

        //Converting the XWiki objects into REST representations, while ignoring unnecessary data
        Map<String, Map<String, String>> phenotypes = new HashMap<String, Map<String, String>>();
        for (BaseObject object : phenotypeObjects) {
            if (object != null) {
                Map<String, String> phenotypeMap = new HashMap<String, String>();
                String phenotypeId = object.getStringValue("target_property_value");

                for (Object fieldUncast : object.getFieldList()) {
                    BaseStringProperty field = (BaseStringProperty) fieldUncast;
                    phenotypeMap.put(field.getName(), field.getValue());
                }

                phenotypes.put(phenotypeId, phenotypeMap);
            }
        }

        return phenotypes;
    }
}
